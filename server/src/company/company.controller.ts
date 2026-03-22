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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiTags('Companies')
@ApiBearerAuth('bearer')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) companyId: string) {
    return await this.companyService.findOne(companyId);
  }

  @Post('create')
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companyService.createCompany(createCompanyDto);
  }
}
