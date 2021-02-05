import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection } from 'typeorm';
import { AppModule } from '@src/app.module';
import request from 'supertest';
import Faker from 'faker';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import { MemberRoleEnum } from '@/src/schema/models/members/members.dto';
import UsersService from '@schema/models/users/users.service';
import { Tokens } from '@schema/models/tokens/tokens.service';
import { ChatTypeSeeder, ChatTypeFactory } from '@db/seeds/chat-type.seeder';
import {
  MemberRoleSeeder,
  MemberRoleFactory
} from '@db/seeds/member-role.seeder';
import UserEntity from '@db/entities/user.entity';
import ChatEntity from '@db/entities/chat.entity';
import { CursorCoder } from '@lib/pagination/cursor';
import ChatsService from '@schema/models/chats/chats.service';
import { ChatPaginationField } from '@schema/models/chats/chats.model.pagination';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [ChatsResolver] ...', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    connection = getConnection();

    await connection.synchronize(true);

    const chatTypeSeeder = new ChatTypeSeeder(new ChatTypeFactory());
    await chatTypeSeeder.run(1, { name: ChatTypeEnum.DIALOG });
    await chatTypeSeeder.run(1, { name: ChatTypeEnum.GROUP });
    await chatTypeSeeder.run(1, { name: ChatTypeEnum.CHANNEL });

    const memberPriviliegeSeeder = new MemberRoleSeeder(
      new MemberRoleFactory()
    );
    await memberPriviliegeSeeder.run(1, {
      name: MemberRoleEnum.CREATOR,
      weight: 1
    });
    await memberPriviliegeSeeder.run(1, {
      name: MemberRoleEnum.ADMIN,
      weight: 0.5
    });
    await memberPriviliegeSeeder.run(1, {
      name: MemberRoleEnum.MEMBER,
      weight: 0.1
    });
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Dialogs] ...', () => {
    const user: UserEntity = <any>{};
    const tokens: Tokens = <any>{};
    let chats: ChatEntity[] = [];

    beforeAll(async () => {
      const usersService = app.get<UsersService>(UsersService);
      const users: { user: UserEntity; password: string }[] = [];

      for (let i = 0; i < 10; ++i) {
        const payload = {
          email: Faker.internet.email(),
          password: Faker.random.word()
        };
        const user = await usersService.create({
          name: Faker.internet.userName(),
          ...payload
        });

        users.push({ user, password: payload.password });
      }

      Object.assign(user, users[0].user);

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
                        mutation($payload: AuthLoginDTO!) {
                            auth {
                                login(payload: $payload) {
                                    accessToken
                                    refreshToken
                                }
                            }
                        }
                    `,
          variables: {
            payload: {
              email: user.email,
              password: users[0].password
            }
          }
        });

      Object.assign(tokens, res.body.data.auth.login);

      const chatsService = app.get<ChatsService>(ChatsService);
      for (let i = 1; i < users.length; ++i)
        chats.push(
          await chatsService.create(user.id, ChatTypeEnum.DIALOG, {
            userIds: [users[i].user.id]
          })
        );

      chats = chats.sort((f, s) => (f.id > s.id ? 1 : f.id < s.id ? -1 : 0));
    });

    describe('[Getting] [Pagination] [All] ...', () => {
      it('should return all chats of the user', async () => {
        const key = ChatPaginationField.ID;
        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .send({
            query: `
                            query {
                                me {
                                    chats {
                                        edges {
                                            cursor
                                            node {
                                                id
                                                title
                                                description
                                                type
                                                createdAt
                                            }
                                        }
                                        totalCount
                                        pageInfo {
                                            startCursor
                                            endCursor
                                            hasNextPage
                                            hasPreviousPage
                                        }
                                    }
                                }
                            }
                        `
          });

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          data: {
            me: {
              chats: {
                edges: chats.map(chat => ({
                  cursor: CursorCoder.encode({ [key]: chat.id }),
                  node: {
                    id: chat.id,
                    title: chat.title,
                    description: chat.description,
                    type: chat.type.name,
                    createdAt: chat.createdAt.toISOString()
                  }
                })),
                totalCount: chats.length,
                pageInfo: {
                  startCursor: CursorCoder.encode({ [key]: chats[0].id }),
                  endCursor: CursorCoder.encode({
                    [key]: chats[chats.length - 1].id
                  }),
                  hasNextPage: false,
                  hasPreviousPage: false
                }
              }
            }
          }
        });
      });
    });
  });
});
