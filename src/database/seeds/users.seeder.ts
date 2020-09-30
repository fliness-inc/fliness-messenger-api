import { getRepository } from 'typeorm';
import Faker from 'faker';
import User from '@database/entities/user';
import IFactory from './factory';
import ISeeder from './seeder';

export class UserFactory implements IFactory<User> {
    public create({ name, email, password }: Partial<User> = {}) {
        const user = new User();
        user.email = email || Faker.internet.email();
        user.name = name || `${Faker.name.lastName()} ${Faker.name.firstName()}`;
        user.password = password || Faker.random.word();
        return user;
    }
}

export class UserSeeder implements ISeeder<User> {
  public constructor(private readonly factory: UserFactory) {}

  public async run(count: number): Promise<User[]> {
    const users = [];

    for (let i = 0; i < count; ++i)
      users.push(await getRepository(User).save(this.factory.create()));

    return users;
  }
}

export default UserFactory;
