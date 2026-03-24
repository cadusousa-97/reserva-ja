import { Injectable } from '@nestjs/common';

export type User = Record<string, unknown>;

@Injectable({})
export class UsersService {
  findOne(username: string): User | undefined {
    void username;
    return undefined;
  }
}
