import { createConnection, Connection } from 'typeorm';
import { config as setupDotEnv } from 'dotenv';
import { UserSeeder, UserFactory } from './users.seeder';
import { InvitationStatusSeeder, InvitationStatusFactory } from './invitation-status.seeder';
import { InvitationTypeSeeder, InvitationTypeFactory } from './invitation-type.seeder';
import { Type, Status } from '@schema/resolvers/invitations/invitations.dto';

setupDotEnv();

createConnection().then(async (connection: Connection) => {
    connection.query(`
        TRUNCATE 
            users, 
            tokens, 
            invitation_statuses, 
            invitation_types, 
            invitations, 
            friends
        CASCADE
    `);

    const userSeeder = new UserSeeder(new UserFactory());
    await userSeeder.run(10);

    const invitationStatusSeeder = new InvitationStatusSeeder(new InvitationStatusFactory());
    await invitationStatusSeeder.run(1, { name: Status.ACCEPTED });
    await invitationStatusSeeder.run(1, { name: Status.REJECTED });
    await invitationStatusSeeder.run(1, { name: Status.WAITING });

    const invitationTypeSeeder = new InvitationTypeSeeder(new InvitationTypeFactory());
    await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_FRIENDS });
    await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_GROUP });
    await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_CHANNEL });
});
