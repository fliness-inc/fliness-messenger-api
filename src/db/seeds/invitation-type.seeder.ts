import Faker from 'faker';
import { InvitationType } from '@db/entities/invitation-type.entity';
import Factory from './factory';
import Seeder from './seeder';

export class InvitationTypeFactory implements Factory<InvitationType> {
  public create({ name }: Partial<InvitationType> = {}) {
    const user = new InvitationType();
    user.name = name || Faker.random.word();
    return user;
  }
}

export class InvitationTypeSeeder extends Seeder<InvitationType>(
  InvitationType
) {
  public constructor(factory: InvitationTypeFactory) {
    super(factory);
  }
}

export default InvitationTypeSeeder;
