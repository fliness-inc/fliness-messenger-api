import Faker from 'faker';
import { InvitationStatus } from '@database/entities/invitation-status';
import Factory from './factory';
import Seeder from './seeder';

export class InvitationStatusFactory implements Factory<InvitationStatus> {
    public create({ name }: Partial<InvitationStatus> = {}) {
        const user = new InvitationStatus();
        user.name = name || Faker.random.word();
        return user;
    }
}

export class InvitationStatusSeeder extends Seeder<InvitationStatus>(InvitationStatus) {
    public constructor(factory: InvitationStatusFactory) {
        super(factory);
    }
}

export default InvitationStatusSeeder;
