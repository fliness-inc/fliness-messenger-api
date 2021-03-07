import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Connection, getConnection, Not } from 'typeorm';
import * as request from 'supertest';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
import * as faker from 'faker';
import { ChatsService } from '../chats.service';
import { Tokens, TokensService } from '~/modules/tokens/tokens.service';
import { UsersService } from '~/modules/users/users.service';
import UserEntity from '~/db/entities/user.entity';
import { ChatCreateDTO, ChatTypeEnum } from '../chats.dto';
import { AppModule } from '~/app.module';
import MembersService from '~/modules/members/members.service';
import { MemberRoleEnum } from '~/modules/members/members.dto';
import initApp from '~/app';
import ChatEntity from '~/db/entities/chat.entity';
import ChatTypeEntity from '~/db/entities/chat-type.entity';
import MessagesService from '~/modules/messages/messages.service';

dotenv.config();

jest.setTimeout(50000);

describe('[IT] [ChatsModule] ...', () => {
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

  describe('[/POST] ...', () => {
    it('should create a chat', async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      const payload: ChatCreateDTO = {
        type: ChatTypeEnum.DIALOG,
        userIds: [secondAccount.user.id],
      };

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      expect(res.status).toEqual(201);
      expect(res.body).toStrictEqual({
        statusCode: 201,
        data: {
          id: res.body.data.id,
          title: null,
          description: null,
          typeId: res.body.data.typeId,
          updatedAt: res.body.data.updatedAt,
          createdAt: res.body.data.createdAt,
        },
      });
    });

    it('should create the chat when the userIds property contain the creator id and the id of the second user', async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      const payload: ChatCreateDTO = {
        type: ChatTypeEnum.DIALOG,
        userIds: [firstAccount.user.id, secondAccount.user.id],
      };

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      expect(res.status).toEqual(201);
      expect(res.body).toStrictEqual({
        statusCode: 201,
        data: {
          id: res.body.data.id,
          title: null,
          description: null,
          typeId: res.body.data.typeId,
          updatedAt: res.body.data.updatedAt,
          createdAt: res.body.data.createdAt,
        },
      });
    });

    it('should return 400 when the type property was not specified', async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      const payload: any = {
        userIds: [secondAccount.user.id],
      };

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      expect(res.status).toEqual(400);
      expect(res.body).toStrictEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'The resolver was not found: undefined',
      });
    });

    it('should return 400 when the creator tries to create a dialog that has already been created', async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      const payload: ChatCreateDTO = {
        type: ChatTypeEnum.DIALOG,
        userIds: [secondAccount.user.id],
      };

      await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      expect(res.status).toEqual(400);
      expect(res.body).toStrictEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'The dialog was already created',
      });
    });

    it('should return 400 when the companion tries to create a dialog that has already been created', async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send({
          type: ChatTypeEnum.DIALOG,
          userIds: [secondAccount.user.id],
        });

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${secondAccount.tokens.accessToken}`,
        })
        .send({
          type: ChatTypeEnum.DIALOG,
          userIds: [firstAccount.user.id],
        });

      expect(res.status).toEqual(400);
      expect(res.body).toStrictEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'The dialog was already created',
      });
    });

    it('should return 400 when the type property contain invalid value', async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      const type = faker.random.word();

      const payload: any = {
        type: type,
        userIds: [secondAccount.user.id],
      };

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      expect(res.status).toEqual(400);
      expect(res.body).toStrictEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: `The resolver was not found: ${type}`,
      });
    });

    it('should return 400 when the userIds property not contain the second user', async () => {
      const firstAccount = accounts[0];

      const payload: any = {
        type: ChatTypeEnum.DIALOG,
        userIds: [],
      };

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      expect(res.status).toEqual(400);
      expect(res.body).toStrictEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'The dialog chat must contain the only one additional member',
      });
    });

    it('should return 400 when the userIds property contain invalid value', async () => {
      const firstAccount = accounts[0];

      const payload: any = {
        type: ChatTypeEnum.DIALOG,
        userIds: null,
      };

      const res = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      expect(res.status).toEqual(400);
      expect(res.body).toStrictEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'The userIds must be an array',
      });
    });

    it('should return 401 when the unauthorized user trying to create new dialog', async () => {
      const secondAccount = accounts[1];

      const payload: ChatCreateDTO = {
        type: ChatTypeEnum.DIALOG,
        userIds: [secondAccount.user.id],
      };

      const res = await request(app.getHttpServer())
        .post('/chats')
        .send(payload);

      expect(res.status).toEqual(401);
      expect(res.body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The authentication fails',
      });
    });
  });
  describe('[/DELETE] ...', () => {
    let chat: ChatEntity;

    beforeEach(async () => {
      const firstAccount = accounts[0];
      const secondAccount = accounts[1];

      const payload: ChatCreateDTO = {
        type: ChatTypeEnum.DIALOG,
        userIds: [secondAccount.user.id],
      };

      const chatCreateRes = await request(app.getHttpServer())
        .post('/chats')
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send(payload);

      chat = chatCreateRes.body.data;
    });

    it('should delete the chat', async () => {
      const firstAccount = accounts[0];

      const chatDeleleRes = await request(app.getHttpServer())
        .delete(`/chats/${chat.id}`)
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send();

      expect(chatDeleleRes.status).toEqual(200);
      expect(chatDeleleRes.body).toStrictEqual({
        statusCode: 200,
      });
    });

    it('should return 404 when a chatId is not valid', async () => {
      const firstAccount = accounts[0];
      const invalidChatId = uuid.v4();

      const chatDeleleRes = await request(app.getHttpServer())
        .delete(`/chats/${invalidChatId}`)
        .set({
          Authorization: `Bearer ${firstAccount.tokens.accessToken}`,
        })
        .send();

      expect(chatDeleleRes.status).toEqual(404);
      expect(chatDeleleRes.body).toStrictEqual({
        statusCode: 404,
        error: 'Not Found',
        message: `The chat was not find with the id: ${invalidChatId}`,
      });
    });

    test.todo(
      'should return 403 status when a non-Creator user tries to delete the chat'
    );
  });

  describe('[/GET] ...', () => {
    const chats: ChatEntity[] = [];
    const chatTypes: ChatTypeEntity[] = [];

    beforeEach(async () => {
      for (let i = 0; i < accounts.length - 1; ++i) {
        for (let j = i + 1; j < accounts.length; ++j) {
          chats.push(
            await chatsService.create(
              accounts[i].user.id,
              ChatTypeEnum.DIALOG,
              {
                userIds: [accounts[j].user.id],
              }
            )
          );
        }
      }

      chatTypes.push(...(await chatsService.getChatTypes()));
    });

    it('should return all chats', async () => {
      const currentAccount =
        accounts[faker.random.number({ min: 0, max: accounts.length - 1 })];

      const currentMembersOfAccount = await membersService.find({
        select: ['chatId'],
        where: {
          userId: currentAccount.user.id,
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/me/chats/`)
        .set({
          Authorization: `Bearer ${currentAccount.tokens.accessToken}`,
        })
        .send();

      const filteredChats = chats.filter(chat =>
        currentMembersOfAccount.some(m => m.chatId === chat.id)
      );

      const serializedChats = [];

      for (const chat of filteredChats) {
        const currentChatType = chatTypes.find(t => t.id === chat.typeId);
        const companionMember = await membersService.findOne({
          select: [
            'id',
            'roleId',
            'userId',
            'chatId',
            'updatedAt',
            'createdAt',
          ],
          where: { chatId: chat.id, userId: Not(currentAccount.user.id) },
        });

        serializedChats.push({
          id: chat.id,
          title: chat.title,
          description: chat.description,
          typeId: chat.typeId,
          type: {
            id: currentChatType.id,
            name: currentChatType.name,
            updatedAt: currentChatType.updatedAt.toISOString(),
            createdAt: currentChatType.createdAt.toISOString(),
          },
          members: [
            {
              id: companionMember.id,
              roleId: companionMember.roleId,
              userId: companionMember.userId,
              chatId: companionMember.chatId,
              updatedAt: companionMember.updatedAt.toISOString(),
              createdAt: companionMember.createdAt.toISOString(),
            },
          ],
          countMessageViews: 0,
          messages: await messagesService.getLastMessages(chat.id),
          updatedAt: chat.updatedAt.toISOString(),
          createdAt: chat.createdAt.toISOString(),
        });
      }

      expect(res.status).toEqual(200);
      expect(res.body).toStrictEqual({
        statusCode: 200,
        data: serializedChats,
      });
    });
  });
});
