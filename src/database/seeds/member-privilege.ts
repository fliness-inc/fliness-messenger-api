import Faker from 'faker';
import { MemberPriviliege } from '@database/entities/member-privilege';
import Factory from './factory';
import Seeder from './seeder';

export class MemberPriviliegeFactory implements Factory<MemberPriviliege> {
    public create({ name }: Partial<MemberPriviliege> = {}) {
        const user = new MemberPriviliege();
        user.name = name || Faker.random.word();
        return user;
    }
}

export class MemberPriviliegeSeeder extends Seeder<MemberPriviliege>(MemberPriviliege) {
    public constructor(factory: MemberPriviliegeFactory) {
        super(factory);
    }
}

export default MemberPriviliegeSeeder;
