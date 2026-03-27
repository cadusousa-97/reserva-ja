import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

type IdempotentResponse<T> = {
  statusCode: number;
  body: T;
};

type ExecuteParams<T> = {
  scope: string;
  key: string;
  payload: unknown;
  ttlMs?: number;
  run: () => Promise<IdempotentResponse<T>>;
};

@Injectable()
export class IdempotencyService {
  private static readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
  private static readonly STATUS_PROCESSING = 'PROCESSING';
  private static readonly STATUS_SUCCEEDED = 'SUCCEEDED';
  private static readonly STATUS_FAILED = 'FAILED';

  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(params: ExecuteParams<T>): Promise<IdempotentResponse<T>> {
    const { scope, payload, run } = params;
    const key = params.key?.trim();

    if (!key) {
      throw new BadRequestException('Cabeçalho Idempotency-Key é obrigatório.');
    }

    const ttlMs = params.ttlMs ?? IdempotencyService.DEFAULT_TTL_MS;
    const expiresAt = new Date(Date.now() + ttlMs);
    const requestHash = this.buildRequestHash(payload);

    const claimed = await this.claimRequestOrReplay<T>({
      scope,
      key,
      requestHash,
      expiresAt,
    });

    if ('replay' in claimed) {
      return claimed.replay;
    }

    try {
      const response = await run();

      await this.prisma.idempotencyKey.update({
        where: { id: claimed.id },
        data: {
          status: IdempotencyService.STATUS_SUCCEEDED,
          responseStatusCode: response.statusCode,
          responseBody: response.body as object,
          expiresAt,
        },
      });

      return response;
    } catch (error) {
      const serializedError = this.serializeError(error);

      await this.prisma.idempotencyKey.update({
        where: { id: claimed.id },
        data: {
          status: IdempotencyService.STATUS_FAILED,
          responseStatusCode: serializedError.statusCode,
          responseBody: serializedError.body,
          errorCode: serializedError.errorCode,
          expiresAt,
        },
      });

      throw error;
    }
  }

  private async claimRequestOrReplay<T>(params: {
    scope: string;
    key: string;
    requestHash: string;
    expiresAt: Date;
  }): Promise<{ id: string } | { replay: IdempotentResponse<T> }> {
    const { scope, key, requestHash, expiresAt } = params;

    try {
      const created = await this.prisma.idempotencyKey.create({
        data: {
          scope,
          key,
          requestHash,
          status: IdempotencyService.STATUS_PROCESSING,
          expiresAt,
        },
        select: { id: true },
      });

      return created;
    } catch (error) {
      if (
        !(error instanceof PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }
    }

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { scope_key: { scope, key } },
      select: {
        requestHash: true,
        status: true,
        responseStatusCode: true,
        responseBody: true,
      },
    });

    if (!existing) {
      throw new ConflictException('Falha ao recuperar estado idempotente.');
    }

    if (existing.requestHash !== requestHash) {
      throw new ConflictException(
        'Idempotency-Key reutilizada com payload diferente.',
      );
    }

    if (existing.status === IdempotencyService.STATUS_PROCESSING) {
      throw new ConflictException(
        'Requisicao com esta Idempotency-Key ainda esta em processamento.',
      );
    }

    if (typeof existing.responseStatusCode !== 'number') {
      throw new ConflictException(
        'Requisicao idempotente sem resposta registrada.',
      );
    }

    if (existing.status === IdempotencyService.STATUS_FAILED) {
      throw new HttpException(
        (existing.responseBody as object) ?? {
          message: 'Requisição anterior falhou para esta Idempotency-Key.',
        },
        existing.responseStatusCode,
      );
    }

    return {
      replay: {
        statusCode: existing.responseStatusCode,
        body: existing.responseBody as T,
      },
    };
  }

  private serializeError(error: unknown): {
    statusCode: number;
    body: object;
    errorCode: string;
  } {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const statusCode = error.getStatus();
      const body =
        typeof response === 'string' ? { message: response } : response;
      return {
        statusCode,
        body,
        errorCode: error.name,
      };
    }

    const fallback = new InternalServerErrorException(
      'Erro interno do servidor.',
    );
    return {
      statusCode: fallback.getStatus(),
      body: fallback.getResponse() as object,
      errorCode: 'InternalServerError',
    };
  }

  private buildRequestHash(payload: unknown): string {
    const canonical = this.canonicalize(payload);
    return createHash('sha256').update(canonical).digest('hex');
  }

  private canonicalize(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalize(item)).join(',')}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    return `{${entries
      .map(([key, val]) => `${JSON.stringify(key)}:${this.canonicalize(val)}`)
      .join(',')}}`;
  }
}
