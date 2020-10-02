import Faker from 'faker';
import User from '@database/entities/user';
import Factory from './factory';
import Seeder from './seeder';

export class UserFactory implements Factory<User> {
    public create({ name, email, password }: Partial<User> = {}) {
        const user = new User();
        user.email = email || Faker.internet.email();
        user.name = name || `${Faker.name.lastName()} ${Faker.name.firstName()}`;
        user.password = password || Faker.random.word();
        return user;
    }
}

export class UserSeeder extends Seeder<User>(User) {
    public constructor(factory: UserFactory) {
        super(factory);
    }
}

export default UserSeeder;
