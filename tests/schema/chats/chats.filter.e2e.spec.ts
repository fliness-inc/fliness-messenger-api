import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection } from 'typeorm';
import User from '@db/entities/user.entity';
import { AppModule } from '@src/app.module';
import request from 'supertest';
import Faker from 'faker';
import { ChatTypeEnum } from '@schema/models/chats/chats.dto';
import { MemberRoleEnum } from '@schema/models/members/members.dto';
import UsersService from '@schema/models/users/users.service';
import { Tokens } from '@schema/models/tokens/tokens.service';
import { ChatTypeSeeder, ChatTypeFactory } from '@db/seeds/chat-type.seeder';
import {
  MemberRoleSeeder,
  MemberRoleFactory
} from '@db/seeds/member-role.seeder';
import ChatsService from '@schema/models/chats/chats.service';
import { ChatPaginationField } from '@schema/models/chats/chats.model.pagination';
import { CursorCoder } from '@lib/pagination/cursor';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [ChatResolver] ...', () => {
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
    const users: { user: User; tokens: Tokens }[] = [];
    let chats = [];

    beforeAll(async () => {
      const usersService = app.get<UsersService>(UsersService);

      for (let i = 0; i < 3; ++i) {
        const payload = {
          email: Faker.internet.email(),
          password: Faker.random.word()
        };
        const user = await usersService.create({
          name: Faker.internet.userName(),
          ...payload
        });
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
              payload
            }
          });
        users.push({
          user,
          tokens: res.body.data.auth.login
        });
      }

      const chatsService = app.get<ChatsService>(ChatsService);
      for (let i = 1; i < users.length; ++i)
        chats.push(
          await chatsService.create(users[0].user.id, ChatTypeEnum.DIALOG, {
            userIds: [users[i].user.id]
          })
        );

      for (let i = 1; i < users.length / 2; ++i)
        chats.push(
          await chatsService.create(users[0].user.id, ChatTypeEnum.GROUP, {
            userIds: [users[i].user.id]
          })
        );

      for (let i = 1; i < users.length / 4; ++i)
        chats.push(
          await chatsService.create(users[0].user.id, ChatTypeEnum.CHANNEL, {
            userIds: [users[i].user.id]
          })
        );

      chats = chats.sort((f, s) => (f.id > s.id ? 1 : f.id < s.id ? -1 : 0));
    });

    describe('[Getting] [Filtering] ...', () => {
      it('should return the chats of the DIALOG type', async () => {
        const [creator, companion] = users;

        const neededChats = chats.filter(
          c => c.type.name === ChatTypeEnum.DIALOG
        );

        const key = ChatPaginationField.ID;
        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            query: `
                query($filter: ChatsFilter) {
                    me {
                        chats(filter: $filter) {
                            edges {
                                cursor
                                node {
                                    id
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
            `,
            variables: {
              filter: {
                field: {
                  name: 'TYPE_NAME',
                  op: 'EQUALS',
                  val: ChatTypeEnum.DIALOG
                }
              }
            }
          });

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          data: {
            me: {
              chats: {
                edges: neededChats.map(chat => ({
                  cursor: CursorCoder.encode({ [key]: chat.id }),
                  node: {
                    id: chat.id
                  }
                })),
                totalCount: neededChats.length,
                pageInfo: {
                  startCursor: CursorCoder.encode({ [key]: neededChats[0].id }),
                  endCursor: CursorCoder.encode({
                    [key]: neededChats[neededChats.length - 1].id
                  }),
                  hasNextPage: false,
                  hasPreviousPage: false
                }
              }
            }
          }
        });
      });

      it('should return the chat of the specific id', async () => {
        const [creator, companion] = users;

        const neededChat = chats[0];

        const key = ChatPaginationField.ID;
        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            query: `
                query($filter: ChatsFilter) {
                    me {
                        chats(filter: $filter) {
                            edges {
                                cursor
                                node {
                                    id
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
            `,
            variables: {
              filter: {
                field: {
                  name: 'ID',
                  op: 'EQUALS',
                  val: neededChat.id
                }
              }
            }
          });

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          data: {
            me: {
              chats: {
                edges: [
                  {
                    cursor: CursorCoder.encode({ [key]: neededChat.id }),
                    node: {
                      id: neededChat.id
                    }
                  }
                ],
                totalCount: 1,
                pageInfo: {
                  startCursor: CursorCoder.encode({ [key]: neededChat.id }),
                  endCursor: CursorCoder.encode({ [key]: neededChat.id }),
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
