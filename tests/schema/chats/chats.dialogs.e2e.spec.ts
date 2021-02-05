import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection, getRepository } from 'typeorm';
import User from '@db/entities/user.entity';
import { AppModule } from '@src/app.module';
import request from 'supertest';
import * as uuid from 'uuid';
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
import Member from '@db/entities/member.entity';
import Chat from '@db/entities/chat.entity';

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

  afterEach(async () => {
    await connection.query('TRUNCATE chats, members CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Dialogs] ...', () => {
    const users: { user: User; tokens: Tokens }[] = [];

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
    });

    describe('[Creating] ...', () => {
      it('should create the chat', async () => {
        const [creator, companion] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            query: `
                            mutation($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: [companion.user.id]
              }
            }
          });

        expect(res.status).toEqual(200);

        const data = res.body.data;
        expect(data).toHaveProperty('me');
        expect(data.me).toHaveProperty('chats');
        expect(data.me.chats).toHaveProperty('create');

        const chat = data.me.chats.create;
        expect(chat).toStrictEqual({
          id: chat.id,
          title: null,
          description: null,
          createdAt: chat.createdAt,
          type: ChatTypeEnum.DIALOG
        });

        expect(uuid.validate(chat.id)).toBeTruthy();
        expect(uuid.version(chat.id)).toEqual(4);

        expect(new Date(chat.createdAt).getTime()).not.toBeNaN();

        expect(await getRepository(Member).count()).toEqual(2);
        expect(await getRepository(Chat).count()).toEqual(1);
      });

      it('should create the chat when the userIds property contain the creator id and the id of the second user', async () => {
        const [creator, companion] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            query: `
                            mutation($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: [creator.user.id, companion.user.id]
              }
            }
          });

        expect(Array.isArray(res.body.errors)).toBeFalsy();

        expect(await getRepository(Member).count()).toEqual(2);
        expect(await getRepository(Chat).count()).toEqual(1);
      });

      it('should return 400 when the type property was not specified', async () => {
        const [creator, companion] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                userIds: [companion.user.id]
              }
            }
          });

        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors).toHaveLength(1);

        expect(await getRepository(Member).count()).toEqual(0);
        expect(await getRepository(Chat).count()).toEqual(0);
      });

      it('should return 400 when the type property contain invalid value', async () => {
        const [creator, companion] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: Faker.random.word(),
                userIds: [companion.user.id]
              }
            }
          });

        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors).toHaveLength(1);

        expect(await getRepository(Member).count()).toEqual(0);
        expect(await getRepository(Chat).count()).toEqual(0);
      });

      it('should return 400 when the userIds property not contain the second user', async () => {
        const [creator, companion] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: []
              }
            }
          });

        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors).toHaveLength(1);
        expect(res.body.errors[0].extensions.exception.status).toStrictEqual(
          400
        );

        expect(await getRepository(Member).count()).toEqual(0);
        expect(await getRepository(Chat).count()).toEqual(0);
      });

      it('should return 400 when the userIds property contain invalid value', async () => {
        const [creator, companion] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: null
              }
            }
          });

        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors).toHaveLength(1);

        expect(await getRepository(Member).count()).toEqual(0);
        expect(await getRepository(Chat).count()).toEqual(0);
      });

      it('should return 400 when the userIds property contain more one member id and not contain  the creator id', async () => {
        const [creator, companion, otherUser] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: [companion.user.id, otherUser.user.id]
              }
            }
          });

        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors).toHaveLength(1);
        expect(res.body.errors[0].extensions.exception.status).toStrictEqual(
          400
        );

        expect(await getRepository(Member).count()).toEqual(0);
        expect(await getRepository(Chat).count()).toEqual(0);
      });

      it('should return 401 when the unauthorized user trying to create new dialog', async () => {
        const [creator, companion] = users;

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: [companion.user.id]
              }
            }
          });

        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors).toHaveLength(1);
        expect(res.body.errors[0].extensions.exception.status).toStrictEqual(
          401
        );

        expect(await getRepository(Member).count()).toEqual(0);
        expect(await getRepository(Chat).count()).toEqual(0);
      });
    });
    describe('[Deleting] ...', () => {
      it('should delete the chat', async () => {
        const [creator, companion] = users;

        const { body } = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: [companion.user.id]
              }
            }
          });

        const chat = body.data.me.chats.create;
        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'RemoveChat',
            query: `
                            mutation RemoveChat($chatId: UUID!) {
                                me {
                                    chats {
                                        remove(chatId: $chatId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              chatId: chat.id
            }
          });

        expect(res.status).toEqual(200);
        expect(await getRepository(Chat).count()).toEqual(1);
        expect(
          await getRepository(Chat).count({ where: { isDeleted: true } })
        ).toEqual(1);
      });

      it('should return the 403 status when a non-Creator user tries to delete the chat', async () => {
        const [creator, companion] = users;

        const { body } = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
          .send({
            operationName: 'CreateChat',
            query: `
                            mutation CreateChat($payload: ChatCreateDTO!) {
                                me {
                                    chats {
                                        create(payload: $payload) {
                                            id title description type createdAt
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              payload: {
                type: ChatTypeEnum.DIALOG,
                userIds: [companion.user.id]
              }
            }
          });

        const chat = body.data.me.chats.create;
        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${companion.tokens.accessToken}`)
          .send({
            operationName: 'RemoveChat',
            query: `
                            mutation RemoveChat($chatId: UUID!) {
                                me {
                                    chats {
                                        remove(chatId: $chatId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
            variables: {
              chatId: chat.id
            }
          });

        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors).toHaveLength(1);
        expect(res.body.errors[0].extensions.exception.status).toStrictEqual(
          403
        );

        expect(
          await getRepository(Chat).count({ where: { isDeleted: false } })
        ).toEqual(1);
        expect(
          await getRepository(Chat).count({ where: { isDeleted: true } })
        ).toEqual(0);
      });
    });
  });
});
