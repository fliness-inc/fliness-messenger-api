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
import { ChatFactory, ChatSeeder } from './chat.seeder';
import { MemberSeeder, MemberFactory } from './member.seeder';
import { MessageSeeder, MessageFactory } from './message.seeder';
import Faker from 'faker';

setupDotEnv();

createConnection().then(async (connection: Connection) => {
	await connection.synchronize(true);

	const userSeeder = new UserSeeder(new UserFactory());
	const users = await userSeeder.run(11, { password: '123' });

	const invitationStatusSeeder = new InvitationStatusSeeder(new InvitationStatusFactory());
	await invitationStatusSeeder.run(1, { name: Status.ACCEPTED });
	await invitationStatusSeeder.run(1, { name: Status.REJECTED });
	await invitationStatusSeeder.run(1, { name: Status.WAITING });

	const invitationTypeSeeder = new InvitationTypeSeeder(new InvitationTypeFactory());
	await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_FRIENDS });
	await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_GROUP });
	await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_CHANNEL });

	const chatTypeSeeder = new ChatTypeSeeder(new ChatTypeFactory());
	const dialog = (await chatTypeSeeder.run(1, { name: ChatTypeEnum.DIALOG }))[0];
	await chatTypeSeeder.run(1, { name: ChatTypeEnum.GROUP });
	await chatTypeSeeder.run(1, { name: ChatTypeEnum.CHANNEL });

	const memberPriviliegeSeeder = new MemberRoleSeeder(new MemberRoleFactory());
	const creatorType = (await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.CREATOR, weight: 1 }))[0];
	await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.ADMIN, weight: 0.5 });
	const memberType = (await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.MEMBER, weight: 0.1 }))[0];

	const chatsSeeder = new ChatSeeder(new ChatFactory());
	const dialogs = await chatsSeeder.run(10, { typeId: dialog.id });

	const memberSeeder = new MemberSeeder(new MemberFactory());
	for (const dialog of dialogs)
		await memberSeeder.run(1, { 
			chatId: dialog.id, 
			userId: users[0].id, 
			roleId: creatorType.id
		});

	let userNumber = 1;
	const membersChats = [];
	for (const dialog of dialogs)
		membersChats.push((await memberSeeder.run(1, { 
			chatId: dialog.id, 
			userId: users[userNumber++].id, 
			roleId: memberType.id
		}))[0]);

	const messageSeeder = new MessageSeeder(new MessageFactory());

	for (const member of membersChats)
		await messageSeeder.run(1, { 
			memberId: member.id, 
			text: Faker.random.words(), 
		});
});
