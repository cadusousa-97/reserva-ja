import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

const SWAGGER_PATH = 'docs';
type SwaggerDocumentConfig = Omit<OpenAPIObject, 'paths'>;

export function buildSwaggerConfig(): SwaggerDocumentConfig {
  return new DocumentBuilder()
    .setTitle('Reserva Ja API')
    .setDescription('Documentacao da API Reserva Ja')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Insira o token JWT',
        in: 'header',
      },
      'bearer',
    )
    .build();
}

export function setupSwagger(app: INestApplication) {
  const config: SwaggerDocumentConfig = buildSwaggerConfig();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
