import { getConnection } from 'typeorm';
import { ChatTypeSeeder, ChatTypeFactory } from '@db/seeds/chat-type.seeder';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import { MemberRoleEnum } from '@schema/models/members/members.dto';
import {
  MemberRoleSeeder,
  MemberRoleFactory
} from '@db/seeds/member-role.seeder';

export const createTestDatabase = async () => {
  const connection = getConnection();
  await connection.synchronize(true);
  return connection;
};

export const initTestDatabase = async () => {
  const chatTypeSeeder = new ChatTypeSeeder(new ChatTypeFactory());
  await chatTypeSeeder.run(1, { name: ChatTypeEnum.DIALOG });
  await chatTypeSeeder.run(1, { name: ChatTypeEnum.GROUP });
  await chatTypeSeeder.run(1, { name: ChatTypeEnum.CHANNEL });

  const memberPriviliegeSeeder = new MemberRoleSeeder(new MemberRoleFactory());
  await memberPriviliegeSeeder.run(1, {
    name: MemberRoleEnum.CREATOR,
    weight: 1.0
  });
  await memberPriviliegeSeeder.run(1, {
    name: MemberRoleEnum.ADMIN,
    weight: 0.5
  });
  await memberPriviliegeSeeder.run(1, {
    name: MemberRoleEnum.MEMBER,
    weight: 0.1
  });
};
