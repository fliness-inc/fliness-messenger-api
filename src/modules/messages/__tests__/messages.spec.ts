import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Connection, getConnection } from 'typeorm';
import * as request from 'supertest';
import * as dotenv from 'dotenv';
import * as faker from 'faker';
import { MembersService } from '~/modules/members/members.service';
import { Tokens, TokensService } from '~/modules/tokens/tokens.service';
import { UsersService } from '~/modules/users/users.service';
import UserEntity from '~/db/entities/user.entity';
import { MemberRoleEnum } from '~/modules/members/members.dto';
import { AppModule } from '~/app.module';
import initApp from '~/app';
import ChatsService from '~/modules/chats/chats.service';
import { ChatTypeEnum } from '~/modules/chats/chats.dto';
import ChatEntity from '~/db/entities/chat.entity';
import { MessageCreateDTO } from '../messages.dto';
import MessagesService from '../messages.service';
import MessageEntity from '~/db/entities/message.entity';
import MemberEntity from '~/db/entities/member.entity';

dotenv.config();

jest.setTimeout(50000);

describe('[IT] [MessagesModule] ...', () => {
  let app: INestApplication;
  let connection: Connection;

  let chatsService: ChatsService;
  let tokensService: TokensService;
  let usersService: UsersService;
  let membersService: MembersService;
  let messagesService: MessagesService;

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
    messagesService = app.get<MessagesService>(MessagesService);

    connection = getConnection();
    await connection.synchronize(true);

    await chatsService.createChatType(ChatTypeEnum.DIALOG);
    await chatsService.createChatType(ChatTypeEnum.CHANNEL);
    await chatsService.createChatType(ChatTypeEnum.GROUP);

    await membersService.createMemberRole(MemberRoleEnum.ADMIN, 1);
    await membersService.createMemberRole(MemberRoleEnum.CREATOR, 0.5);
    await membersService.createMemberRole(MemberRoleEnum.MEMBER, 0.1);

    await connection.query('TRUNCATE messages CASCADE');
  });

  afterEach(async () => {
    await connection.query('TRUNCATE messages CASCADE');
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

  describe('', () => {
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

    describe('[/POST] ...', () => {
      it('should create a chat message', async () => {
        const firstAccount = accounts[0];
        const payload: MessageCreateDTO = {
          text: faker.random.words(),
        };

        const member = await membersService.findOne({
          select: ['id'],
          where: { chatId: chat.id, userId: firstAccount.user.id },
        });

        const res = await request(app.getHttpServer())
          .post(`/chats/${chat.id}/messages`)
          .set({
            Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
          })
          .send(payload);

        expect(res.status).toEqual(201);
        expect(res.body).toStrictEqual({
          statusCode: 201,
          data: {
            id: res.body.data.id,
            text: payload.text,
            memberId: member.id,
            updatedAt: res.body.data.updatedAt,
            createdAt: res.body.data.createdAt,
          },
        });
      });

      it('should return 404 when chat was not found', async () => {
        const firstAccount = accounts[0];
        const payload: MessageCreateDTO = {
          text: faker.random.words(),
        };

        const res = await request(app.getHttpServer())
          .post(`/chats/${faker.random.uuid()}/messages`)
          .set({
            Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
          })
          .send(payload);

        expect(res.status).toEqual(404);
        expect(res.body).toStrictEqual({
          statusCode: 404,
          error: 'Not Found',
          message: 'The chat was not found',
        });
      });

      it('should return 404 when member was not found', async () => {
        const otherAccount = accounts[3];
        const payload: MessageCreateDTO = {
          text: faker.random.words(),
        };

        const res = await request(app.getHttpServer())
          .post(`/chats/${chat.id}/messages`)
          .set({
            Authorization: `Bearer ${otherAccount.tokens.accessToken}`,
          })
          .send(payload);

        expect(res.status).toEqual(404);
        expect(res.body).toStrictEqual({
          statusCode: 404,
          error: 'Not Found',
          message: 'The member was not found',
        });
      });

      it('should return 404 when user is unauthorized', async () => {
        const payload: MessageCreateDTO = {
          text: faker.random.words(),
        };

        const res = await request(app.getHttpServer())
          .post(`/chats/${faker.random.uuid()}/messages`)
          .send(payload);

        expect(res.status).toEqual(401);
        expect(res.body).toStrictEqual({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'The authentication fails',
        });
      });
    });

    describe('[/GET] ...', () => {
      let messages: MessageEntity[] = [];
      let firstMember: MemberEntity;
      let secondMember: MemberEntity;

      beforeEach(async () => {
        const firstAccount = accounts[0];
        const secondAccount = accounts[1];

        firstMember = await membersService.findOne({
          select: ['id'],
          where: { userId: firstAccount.user.id, chatId: chat.id },
        });

        secondMember = await membersService.findOne({
          select: ['id'],
          where: { userId: secondAccount.user.id, chatId: chat.id },
        });

        messages = [];

        for (let i = 0; i < 10; i++) {
          messages.push(
            await messagesService.create(firstMember.id, {
              text: faker.random.words(),
            })
          );
          messages.push(
            await messagesService.create(secondMember.id, {
              text: faker.random.words(),
            })
          );
        }
      });

      it('should return chat messages', async () => {
        const firstAccount = accounts[0];

        const res = await request(app.getHttpServer())
          .get(`/chats/${chat.id}/messages`)
          .set({
            Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
          })
          .send();

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          statusCode: 200,
          data: messages.map(m => ({
            id: m.id,
            text: m.text,
            memberId: m.memberId,
            updatedAt: m.updatedAt.toISOString(),
            createdAt: m.createdAt.toISOString(),
          })),
        });
      });

      it('should return chat messages (companion)', async () => {
        const secondAccount = accounts[1];

        const res = await request(app.getHttpServer())
          .get(`/chats/${chat.id}/messages`)
          .set({
            Authorization: `Bearer ${secondAccount.tokens.accessToken}`,
          })
          .send();

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          statusCode: 200,
          data: messages.map(m => ({
            id: m.id,
            text: m.text,
            memberId: m.memberId,
            updatedAt: m.updatedAt.toISOString(),
            createdAt: m.createdAt.toISOString(),
          })),
        });
      });
    });
  });
});
