import { createConnection, Connection } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserSeeder, UserFactory } from './users.seed';
import { ChatTypeSeeder, ChatTypeFactory } from './chat-type.seed';
import { ChatTypeEnum } from '~/modules/chats/chats.dto';
import { MemberRoleSeeder, MemberRoleFactory } from './member-roles.seed';
import { MemberRoleEnum } from '~/modules/members/members.dto';

dotenv.config();

createConnection().then(async (connection: Connection) => {
  await connection.synchronize(true);

  const userSeeder = new UserSeeder(new UserFactory());
  await userSeeder.run(11, { password: '123' });

  const chatTypeSeeder = new ChatTypeSeeder(new ChatTypeFactory());
  await chatTypeSeeder.run(1, { name: ChatTypeEnum.DIALOG });
  await chatTypeSeeder.run(1, { name: ChatTypeEnum.GROUP });
  await chatTypeSeeder.run(1, { name: ChatTypeEnum.CHANNEL });

  const memberPriviliegeSeeder = new MemberRoleSeeder(new MemberRoleFactory());
  await memberPriviliegeSeeder.run(1, {
    name: MemberRoleEnum.CREATOR,
    weight: 1,
  });
  await memberPriviliegeSeeder.run(1, {
    name: MemberRoleEnum.ADMIN,
    weight: 0.5,
  });
  await memberPriviliegeSeeder.run(1, {
    name: MemberRoleEnum.MEMBER,
    weight: 0.1,
  });
});
