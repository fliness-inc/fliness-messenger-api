import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Connection, getConnection } from 'typeorm';
import * as request from 'supertest';
import * as dotenv from 'dotenv';
import * as faker from 'faker';
import { MembersService } from '../members.service';
import { Tokens, TokensService } from '~/modules/tokens/tokens.service';
import { UsersService } from '~/modules/users/users.service';
import UserEntity from '~/db/entities/user.entity';
import { MemberRoleEnum } from '../members.dto';
import { AppModule } from '~/app.module';
import initApp from '~/app';
import ChatsService from '~/modules/chats/chats.service';
import { ChatTypeEnum } from '~/modules/chats/chats.dto';
import ChatEntity from '~/db/entities/chat.entity';

dotenv.config();

jest.setTimeout(50000);

describe('[IT] [MembersModule] ...', () => {
  let app: INestApplication;
  let connection: Connection;

  let chatsService: ChatsService;
  let tokensService: TokensService;
  let usersService: UsersService;
  let membersService: MembersService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await initApp(moduleFixture.createNestApplication(), false);
    await app.init();

    chatsService = app.get<ChatsService>(ChatsService);
    tokensService = app.get<TokensService>(TokensService);
    usersService = app.get<UsersService>(UsersService);
    membersService = app.get<MembersService>(MembersService);

    connection = getConnection();
    await connection.synchronize(true);

    await chatsService.createChatType(ChatTypeEnum.DIALOG);
    await chatsService.createChatType(ChatTypeEnum.CHANNEL);
    await chatsService.createChatType(ChatTypeEnum.GROUP);

    await membersService.createMemberRole(MemberRoleEnum.ADMIN, 1);
    await membersService.createMemberRole(MemberRoleEnum.CREATOR, 0.5);
    await membersService.createMemberRole(MemberRoleEnum.MEMBER, 0.1);

    await connection.query('TRUNCATE chats, members CASCADE');
  });

  afterEach(async () => {
    await connection.query('TRUNCATE chats, members CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  const accounts: { user: UserEntity; tokens: Tokens }[] = [];

  beforeAll(async () => {
    for (let i = 0; i < 4; ++i) {
      const password = faker.random.word();

      const user = await usersService.create({
        name: faker.internet.userName(),
        email: faker.internet.email(),
        password,
      });

      const tokens = await tokensService.create(
        user.id,
        faker.internet.userAgent()
      );

      accounts.push({
        user,
        tokens,
      });
    }
  });

  describe('[/GET] ...', () => {
    let chat: ChatEntity;

    beforeAll(async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      chat = await chatsService.create(
        firstAccount.user.id,
        ChatTypeEnum.DIALOG,
        {
          userIds: [secondAccount.user.id],
        }
      );
    });

    it('should return chat members', async () => {
      const firstAccount = accounts[0];

      const members = await membersService.find({
        select: ['id', 'chatId', 'roleId', 'userId', 'updatedAt', 'createdAt'],
        where: { chatId: chat.id },
      });

      const res = await request(app.getHttpServer())
        .get(`/chats/${chat.id}/members`)
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send();

      expect(res.status).toEqual(200);
      expect(res.body).toStrictEqual({
        statusCode: 200,
        data: members.map(m => ({
          ...m,
          updatedAt: m.updatedAt.toISOString(),
          createdAt: m.createdAt.toISOString(),
        })),
      });
    });

    it('should return 404 when chat id is not valid', async () => {
      const firstAccount = accounts[0];

      const res = await request(app.getHttpServer())
        .get(`/chats/${faker.random.uuid()}/members`)
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send();

      expect(res.status).toEqual(404);
      expect(res.body).toStrictEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'The chat was not found',
      });
    });

    it('should return 401 when user is not authorized', async () => {
      const res = await request(app.getHttpServer())
        .get(`/chats/${faker.random.uuid()}/members`)
        .send();

      expect(res.status).toEqual(401);
      expect(res.body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The authentication fails',
      });
    });
  });
});
