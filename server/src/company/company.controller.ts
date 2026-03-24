import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from 'src/common/swagger/dto/api-response.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiTags('Companies')
@ApiBearerAuth('bearer')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @ApiOperation({ summary: 'Busca uma empresa pelo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID UUID da empresa',
    example: 'a3f5e34f-45f1-4cf7-9f1c-b5a8d3d2f1b0',
  })
  @ApiOkResponse({ description: 'Empresa encontrada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'ID invalido.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado.',
    type: ApiErrorResponseDto,
  })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) companyId: string) {
    return await this.companyService.findOne(companyId);
  }

  @ApiOperation({ summary: 'Cria uma nova empresa' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiOkResponse({ description: 'Empresa criada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados invalidos para criacao da empresa.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario nao autenticado.',
    type: ApiErrorResponseDto,
  })
  @Post('create')
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companyService.createCompany(createCompanyDto);
  }
}
