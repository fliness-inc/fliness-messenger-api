import { createConnection, Connection } from 'typeorm';
import { config as setupDotEnv } from 'dotenv';
import { UserSeeder, UserFactory } from './users.seeder';
import { InvitationStatusSeeder, InvitationStatusFactory } from './invitation-status.seeder';
import { InvitationTypeSeeder, InvitationTypeFactory } from './invitation-type.seeder';
import { Type, Status } from '@schema/resolvers/invitations/invitations.dto';
import { ChatTypeSeeder, ChatTypeFactory } from './chat-type.seeder';
import { ChatTypeEnum } from '@schema/resolvers/chats/chats.dto';
import { MemberRoleSeeder, MemberRoleFactory } from './member-role.seeder';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';

setupDotEnv();

createConnection().then(async (connection: Connection) => {
	await connection.synchronize(true);

	const userSeeder = new UserSeeder(new UserFactory());
	await userSeeder.run(11, { password: '123' });

	const invitationStatusSeeder = new InvitationStatusSeeder(new InvitationStatusFactory());
	await invitationStatusSeeder.run(1, { name: Status.ACCEPTED });
	await invitationStatusSeeder.run(1, { name: Status.REJECTED });
	await invitationStatusSeeder.run(1, { name: Status.WAITING });

	const invitationTypeSeeder = new InvitationTypeSeeder(new InvitationTypeFactory());
	await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_FRIENDS });
	await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_GROUP });
	await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_CHANNEL });

	const chatTypeSeeder = new ChatTypeSeeder(new ChatTypeFactory());
	await chatTypeSeeder.run(1, { name: ChatTypeEnum.DIALOG });
	await chatTypeSeeder.run(1, { name: ChatTypeEnum.GROUP });
	await chatTypeSeeder.run(1, { name: ChatTypeEnum.CHANNEL });

	const memberPriviliegeSeeder = new MemberRoleSeeder(new MemberRoleFactory());
	await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.CREATOR, weight: 1 });
	await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.ADMIN, weight: 0.5 });
	await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.MEMBER, weight: 0.1 });
});
