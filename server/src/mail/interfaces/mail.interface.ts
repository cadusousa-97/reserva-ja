export interface Mail<T = any> {
  to: string;
  subject: string;
  template: string;
  context: T;
}
