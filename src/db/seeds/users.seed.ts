import * as faker from 'faker';
import * as fs from 'fs';
import * as path from 'path';
import User from '~/db/entities/user.entity';
import Factory from './factory';
import Seeder from './seeder';

export class UserFactory implements Factory<User> {
  private avatars: string[] = [];

  public constructor() {
    this.avatars = fs.readdirSync(path.resolve(process.cwd(), 'public/img/'));
  }

  public create({ name, email, password }: Partial<User> = {}) {
    const user = new User();
    user.email = email || faker.internet.email();
    user.name = name || `${faker.name.lastName()} ${faker.name.firstName()}`;
    user.password = password || faker.random.word();
    user.avatarURL = `${faker.random.arrayElement(this.avatars)}`;
    return user;
  }
}

export class UserSeeder extends Seeder<User>(User) {
  public constructor(factory: UserFactory) {
    super(factory);
  }
}

export default UserSeeder;
