import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { User } from '@database/entities/user';

@Injectable()
export class FriendsService {
  public async find(): Promise<User[]> {
    return getRepository(User)
      .createQueryBuilder('t')
      .select('t.id', 'id')
      .addSelect('t.name', 'name')
      .addSelect('t.email', 'email')
      .addSelect('t.createdAt', 'createdAt')
      .getMany();
  }

  public async create(data: Partial<User>): Promise<User> {
    const users = getRepository(User);
    const user = users.create(data);
    return users.save(user);
  }
}

export default FriendsService;
