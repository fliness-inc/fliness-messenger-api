import * as faker from 'faker';
import { MemberRoleEntity } from '~/db/entities/member-role.entity';
import Factory from './factory';
import Seeder from './seeder';

export class MemberRoleFactory implements Factory<MemberRoleEntity> {
  public create({ name, weight }: Partial<MemberRoleEntity> = {}) {
    const user = new MemberRoleEntity();
    user.name = name || faker.random.word();
    user.weight = weight || faker.random.float(1);
    return user;
  }
}

export class MemberRoleSeeder extends Seeder<MemberRoleEntity>(
  MemberRoleEntity
) {
  public constructor(factory: MemberRoleFactory) {
    super(factory);
  }
}

export default MemberRoleSeeder;
