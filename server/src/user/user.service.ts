import { Injectable } from '@nestjs/common';

export type User = any;

@Injectable({})
export class UsersService {
  async findOne(username: string): Promise<User | undefined> {}
}
