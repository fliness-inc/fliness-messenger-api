import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection } from 'typeorm';
import { User } from '@db/entities/user.entity';
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
import { FriendSeeder, FriendFactory } from '@db/seeds/friends.seeder';
import { CursorCoder } from '@lib/pagination/cursor';
import { FriendPaginationField } from '@schema/models/friends/friends.model.pagination';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [FriendsResolver] ...', () => {
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

  afterEach(async () => {
    await connection.query('TRUNCATE friends CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Friends] ...', () => {
    const users: { user: User; tokens: Tokens }[] = [];

    beforeAll(async () => {
      const usersService = app.get<UsersService>(UsersService);

      for (let i = 0; i < 15; ++i) {
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
    });

    describe('[Getting] [Pagination] [All] ...', () => {
      it('should return all friends of the user', async () => {
        let friends = [];
        const friendSeeder = new FriendSeeder(new FriendFactory());

        for (let i = 1; i < users.length; ++i)
          friends.push(
            (
              await friendSeeder.run(1, {
                userId: users[0].user.id,
                friendId: users[i].user.id
              })
            )[0]
          );

        friends = friends.sort((f, s) =>
          f.friendId > s.friendId ? 1 : f.friendId < s.friendId ? -1 : 0
        );

        const key = FriendPaginationField.ID;
        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${users[0].tokens.accessToken}`)
          .send({
            query: `
                            query {
                                me {
                                    friends {
                                        edges {
                                            cursor
                                            node {
                                                id
                                                name
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
              friends: {
                edges: friends.map(friend => ({
                  cursor: CursorCoder.encode({ [key]: friend.friendId }),
                  node: {
                    id: friend.friendId,
                    name: users.find(u => u.user.id === friend.friendId).user
                      .name
                  }
                })),
                totalCount: friends.length,
                pageInfo: {
                  startCursor: CursorCoder.encode({
                    [key]: friends[0].friendId
                  }),
                  endCursor: CursorCoder.encode({
                    [key]: friends[friends.length - 1].friendId
                  }),
                  hasNextPage: false,
                  hasPreviousPage: false
                }
              }
            }
          }
        });
      });

      it('should return empty friends list of the user', async () => {
        let friends = [];

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${users[0].tokens.accessToken}`)
          .send({
            query: `
                            query {
                                me {
                                    friends {
                                        edges {
                                            cursor
                                            node {
                                                id
                                                name
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
              friends: {
                edges: [],
                totalCount: 0,
                pageInfo: {
                  startCursor: null,
                  endCursor: null,
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
