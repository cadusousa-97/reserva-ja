import { EmployeeRole } from '@prisma/client';
import { JwtPayload } from './jwtPayload.interface';

export interface CompanyJwtPayload extends JwtPayload {
  companyId: string;
  role: EmployeeRole | undefined;
}
