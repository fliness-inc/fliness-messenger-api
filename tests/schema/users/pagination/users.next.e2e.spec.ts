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
import { MemberRoleEnum } from '@/src/schema/models/members/members.dto';
import UsersService from '@schema/models/users/users.service';
import { Tokens } from '@schema/models/tokens/tokens.service';
import { ChatTypeSeeder, ChatTypeFactory } from '@db/seeds/chat-type.seeder';
import {
  MemberRoleSeeder,
  MemberRoleFactory
} from '@db/seeds/member-role.seeder';
import { UserPaginationField } from '@schema/models/users/users.model.pagination';
import { CursorCoder } from '@lib/pagination/pagination';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [UsersResolver] ...', () => {
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

  describe('[Users] ...', () => {
    let usersService: UsersService;

    const users: { user: User; tokens: Tokens }[] = [];
    let sortedUsers: { user: User; tokens: Tokens }[] = [];

    beforeAll(async () => {
      usersService = app.get<UsersService>(UsersService);

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

      sortedUsers = users.sort((f, s) =>
        f.user.id > s.user.id ? 1 : f.user.id < s.user.id ? -1 : 0
      );
    });

    describe('[Getting] [Pagination] [Next] ...', () => {
      // start [] [] [] [] [] ... end
      it('should return the first 5 users', async () => {
        const first = 5;
        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${users[0].tokens.accessToken}`)
          .send({
            query: `
                            query($pagination: UserPaginationInput) {
                                users(pagination: $pagination) {
                                    edges {
                                        cursor
                                        node {
                                            id
                                            name
                                            email
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
                        `,
            variables: {
              pagination: {
                first
              }
            }
          });

        const key = UserPaginationField.ID;

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          data: {
            users: {
              edges: sortedUsers.slice(0, first).map(({ user }) => ({
                cursor: CursorCoder.encode({ [key]: user.id }),
                node: {
                  id: user.id,
                  name: user.name,
                  email: user.email
                }
              })),
              totalCount: sortedUsers.length,
              pageInfo: {
                startCursor: CursorCoder.encode({
                  [key]: sortedUsers[0].user.id
                }),
                endCursor: CursorCoder.encode({
                  [key]: sortedUsers[sortedUsers.length - 1].user.id
                }),
                hasNextPage: true,
                hasPreviousPage: false
              }
            }
          }
        });
      });

      // start ... [] [] [] [] [] ... end
      it('should return the first 5 users after the second user', async () => {
        const first = 5;
        const key = UserPaginationField.ID;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${users[0].tokens.accessToken}`)
          .send({
            query: `
                            query($pagination: UserPaginationInput) {
                                users(pagination: $pagination) {
                                    edges {
                                        cursor
                                        node {
                                            id
                                            name
                                            email
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
                        `,
            variables: {
              pagination: {
                first,
                after: CursorCoder.encode({ [key]: sortedUsers[1].user.id })
              }
            }
          });

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          data: {
            users: {
              edges: sortedUsers.slice(2, first + 2).map(({ user }) => ({
                cursor: CursorCoder.encode({ [key]: user.id }),
                node: {
                  id: user.id,
                  name: user.name,
                  email: user.email
                }
              })),
              totalCount: sortedUsers.length,
              pageInfo: {
                startCursor: CursorCoder.encode({
                  [key]: sortedUsers[0].user.id
                }),
                endCursor: CursorCoder.encode({
                  [key]: sortedUsers[sortedUsers.length - 1].user.id
                }),
                hasNextPage: true,
                hasPreviousPage: true
              }
            }
          }
        });
      });

      // start ... [] [] [] [] [] end
      it('should return the last 5 users', async () => {
        const first = 5;
        const key = UserPaginationField.ID;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${users[0].tokens.accessToken}`)
          .send({
            query: `
                            query($pagination: UserPaginationInput) {
                                users(pagination: $pagination) {
                                    edges {
                                        cursor
                                        node {
                                            id
                                            name
                                            email
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
                        `,
            variables: {
              pagination: {
                first,
                after: CursorCoder.encode({ [key]: sortedUsers[4].user.id })
              }
            }
          });

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          data: {
            users: {
              edges: sortedUsers.slice(5, first + 5).map(({ user }) => ({
                cursor: CursorCoder.encode({ [key]: user.id }),
                node: {
                  id: user.id,
                  name: user.name,
                  email: user.email
                }
              })),
              totalCount: sortedUsers.length,
              pageInfo: {
                startCursor: CursorCoder.encode({
                  [key]: sortedUsers[0].user.id
                }),
                endCursor: CursorCoder.encode({
                  [key]: sortedUsers[sortedUsers.length - 1].user.id
                }),
                hasNextPage: false,
                hasPreviousPage: true
              }
            }
          }
        });
      });

      // start ... [] [] end
      it('should return the last 5 users after the third of the end', async () => {
        const first = 5;
        const key = UserPaginationField.ID;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${users[0].tokens.accessToken}`)
          .send({
            query: `
                            query($pagination: UserPaginationInput) {
                                users(pagination: $pagination) {
                                    edges {
                                        cursor
                                        node {
                                            id
                                            name
                                            email
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
                        `,
            variables: {
              pagination: {
                first,
                after: CursorCoder.encode({ [key]: sortedUsers[7].user.id })
              }
            }
          });

        expect(res.status).toEqual(200);
        expect(res.body).toStrictEqual({
          data: {
            users: {
              edges: users.slice(8, first + 8).map(({ user }) => ({
                cursor: CursorCoder.encode({ [key]: user.id }),
                node: {
                  id: user.id,
                  name: user.name,
                  email: user.email
                }
              })),
              totalCount: sortedUsers.length,
              pageInfo: {
                startCursor: CursorCoder.encode({
                  [key]: sortedUsers[0].user.id
                }),
                endCursor: CursorCoder.encode({
                  [key]: sortedUsers[sortedUsers.length - 1].user.id
                }),
                hasNextPage: false,
                hasPreviousPage: true
              }
            }
          }
        });
      });
    });
  });
});
