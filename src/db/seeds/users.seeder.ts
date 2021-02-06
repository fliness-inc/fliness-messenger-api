import Faker from 'faker';
import User from '@db/entities/user.entity';
import Factory from './factory';
import Seeder from './seeder';
import fs from 'fs';
import path from 'path';

export class UserFactory implements Factory<User> {
  private avatars: string[] = [];

  public constructor() {
    this.avatars = fs.readdirSync(path.resolve(process.cwd(), 'public/img/'));
  }

  public create({ name, email, password }: Partial<User> = {}) {
    const user = new User();
    user.email = email || Faker.internet.email();
    user.name = name || `${Faker.name.lastName()} ${Faker.name.firstName()}`;
    user.password = password || Faker.random.word();
    user.avatarURL = `${Faker.random.arrayElement(this.avatars)}`;
    return user;
  }
}

export class UserSeeder extends Seeder<User>(User) {
  public constructor(factory: UserFactory) {
    super(factory);
  }
}

export default UserSeeder;
