import Faker from 'faker';
import { MemberRole } from '@database/entities/member-role';
import Factory from '@database/seeds/factory';
import Seeder from '@database/seeds/seeder';

export class MemberRoleFactory implements Factory<MemberRole> {
	public create({ name, weight }: Partial<MemberRole> = {}) {
		const user = new MemberRole();
		user.name = name || Faker.random.word();
		user.weight = weight || Faker.random.float(1);
		return user;
	}
}

export class MemberRoleSeeder extends Seeder<MemberRole>(MemberRole) {
	public constructor(factory: MemberRoleFactory) {
		super(factory);
	}
}

export default MemberRoleSeeder;
