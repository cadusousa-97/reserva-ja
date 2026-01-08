interface CompanySummary {
  id: string;
  name: string;
}
export interface UserPayload {
  id: string;
  name: string;
  email: string;
  isEmployee: boolean;
  companies: Array<CompanySummary> | undefined;
}
