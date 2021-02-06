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
import UsersService from '@schema/models/users/users.service';
import { Tokens } from '@schema/models/tokens/tokens.service';
import { FriendPaginationField } from '@schema/models/friends/friends.model.pagination';
import { CursorCoder } from '@lib/pagination/cursor';
import { TestRequest } from '@tools/test-request';
import FriendEntity from '@db/entities/friend.entity';
import { FriendSeeder, FriendFactory } from '@db/seeds/friends.seeder';

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
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Filtering] ...', () => {
    const users: { user: User; tokens: Tokens }[] = [];

    beforeAll(async () => {
      const usersService = app.get<UsersService>(UsersService);

      for (let i = 0; i < 10; ++i) {
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

    describe('[Getting] [Filtering] ...', () => {
      let friends: FriendEntity[] = [];

      beforeAll(async () => {
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
      });
      it('should return specific friend', async () => {
        const [creator, friend] = users;

        const key = FriendPaginationField.ID;
        const { status, body } = await TestRequest.graphql({
          app,
          headers: {
            Authorization: `Bearer ${creator.tokens.accessToken}`
          },
          query: `
            query($filter: FriendsFilter!) {
              me {
                friends(filter: $filter) {
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
          `,
          variables: {
            filter: {
              field: {
                name: 'ID',
                op: 'EQUALS',
                val: friend.user.id
              }
            }
          }
        });

        expect(status).toEqual(200);
        expect(body).toStrictEqual({
          data: {
            me: {
              friends: {
                edges: [
                  {
                    cursor: CursorCoder.encode({ [key]: friend.user.id }),
                    node: {
                      id: friend.user.id,
                      name: friend.user.name
                    }
                  }
                ],
                totalCount: 1,
                pageInfo: {
                  startCursor: CursorCoder.encode({
                    [key]: friend.user.id
                  }),
                  endCursor: CursorCoder.encode({
                    [key]: friend.user.id
                  }),
                  hasNextPage: false,
                  hasPreviousPage: false
                }
              }
            }
          }
        });
      });

      it('should return friends except for the specific friend', async () => {
        const [creator, friend] = users;

        const key = FriendPaginationField.ID;
        const { status, body } = await TestRequest.graphql({
          app,
          headers: {
            Authorization: `Bearer ${creator.tokens.accessToken}`
          },
          query: `
            query($filter: FriendsFilter!) {
              me {
                friends(filter: $filter) {
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
          `,
          variables: {
            filter: {
              field: {
                name: 'ID',
                op: 'NOT_EQUAL',
                val: friend.user.id
              }
            }
          }
        });

        const filteredFriends = friends.filter(
          f => f.userId !== friend.user.id && f.friendId !== friend.user.id
        );

        expect(status).toEqual(200);
        expect(body).toStrictEqual({
          data: {
            me: {
              friends: {
                edges: filteredFriends.map(({ friendId }) => ({
                  cursor: CursorCoder.encode({ [key]: friendId }),
                  node: {
                    id: friendId,
                    name: users.find(u => u.user.id === friendId).user.name
                  }
                })),
                totalCount: filteredFriends.length,
                pageInfo: {
                  startCursor: CursorCoder.encode({
                    [key]: filteredFriends[0].friendId
                  }),
                  endCursor: CursorCoder.encode({
                    [key]: filteredFriends[filteredFriends.length - 1].friendId
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
