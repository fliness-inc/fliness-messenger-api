import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import { Connection, getConnection } from 'typeorm';
import * as request from 'supertest';
import * as uuid from 'uuid';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as faker from 'faker';
import { ChatsModule } from '../chats.module';
import { ChatsService } from '../chats.service';
import { Tokens, TokensService } from '~/modules/tokens/tokens.service';
import { UsersService } from '~/modules/users/users.service';
import UserEntity from '~/db/entities/user.entity';
import ChatEntity from '~/db/entities/chat.entity';
import { ChatTypeEnum } from '../chats.dto';

dotenv.config();

jest.setTimeout(50000);

describe('[IT] [AuthModule] ...', () => {
  let app: INestApplication;
  let connection: Connection;

  let chatsService: ChatsService;
  let tokensService: TokensService;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(), ChatsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    chatsService = app.get<ChatsService>(ChatsService);
    tokensService = app.get<TokensService>(TokensService);
    usersService = app.get<UsersService>(UsersService);

    connection = getConnection();
    await connection.synchronize(true);
  });

  beforeEach(async () => {
    /* await connection.query('TRUNCATE chats CASCADE'); */
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

  describe('[/POST]', () => {});

  /* describe('[/GET] ...', () => {
    const chats: ChatEntity[] = [];

    beforeAll(async () => {
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
    });

    it('should return a chats', async () => {
      const chats = [];

      /* for (let i = 0; i < 10; i++) {
        await chatsService.create();
      }

      const res = await request(app.getHttpServer())
        .get('/chats')
        .set({
          'user-agent': userAgent,
        })
        .send(payload); */
    });
  }); */
});
