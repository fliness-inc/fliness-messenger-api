import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection } from 'typeorm';
import User from '@database/entities/user';
import { AppModule } from '@src/app.module';
import request from 'supertest';
import * as uuid from 'uuid';
import Faker from 'faker';
import { ChatTypeEnum } from '@schema/resolvers/chats/chats.dto';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';
import UsersService from '@schema/resolvers/users/users.service';
import { Tokens } from '@schema/resolvers/tokens/tokens.service';
import { ChatTypeSeeder, ChatTypeFactory } from '@database/seeds/chat-type.seeder';
import { MemberRoleSeeder, MemberRoleFactory } from '@database/seeds/member-role';
import MembersService from '@schema/resolvers/members/members.service';
import Chat from '@database/entities/chat';
import ChatsService from '@schema/resolvers/chats/chats.service';
import MessagesService from '@schema/resolvers/messages/messages.service';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [MessagesResolver] ...', () => {
    let app: INestApplication;
    let connection: Connection;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
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

        const memberPriviliegeSeeder = new MemberRoleSeeder(new MemberRoleFactory());
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.CREATOR, weight: 1.0 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.ADMIN, weight: 0.5 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.MEMBER, weight: 0.1 });
    });

    afterEach(async () => {
        await connection.query('TRUNCATE messages CASCADE');
    });

    afterAll(async () => {
        await app.close();
        await connection.close();
    }); 

    describe('[Text messages] ...', () => {

        let usersService: UsersService;
        let chatsService: ChatsService;
        let membersService: MembersService;
        let messagesService: MessagesService;

        const users: { user: User, tokens: Tokens }[] = [];
        let dialog: Chat;
    
        beforeAll(async () => {
            usersService = app.get<UsersService>(UsersService);
            chatsService = app.get<ChatsService>(ChatsService);
            membersService = app.get<MembersService>(MembersService);
            messagesService =app.get<MessagesService>(MessagesService);

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
                        operationName: 'Login',
                        query: `
                            mutation Login($payload: AuthLoginDTO!) {
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

            dialog =  await chatsService.create(
                users[0].user.id, 
                ChatTypeEnum.DIALOG, 
                { userIds: [users[1].user.id] }
            );
        });

        describe('[Creating] ...', () => {
            it('should create the message', async () => {
                const [user1, user2] = users;
                const payload = {
                    text: 'Hi!',
                    chatId: dialog.id,
                };

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateMessage',
                        query: `
                            mutation CreateMessage($payload: MessageCreateDTO!) {
                                me {
                                    chats {
                                        messages {
                                            create(payload: $payload) {
                                                id text memberId createdAt updatedAt
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload 
                        }
                    });

                const member = await membersService.findOne({ 
                    where: { 
                        userId: user1.user.id,
                        chatId: dialog.id,
                        isDeleted: false
                    } 
                });
                
                expect(res.status).toEqual(200);

                const data = res.body.data;
                expect(data).toHaveProperty('me');
                expect(data.me).toHaveProperty('chats');
                expect(data.me.chats).toHaveProperty('messages');
                expect(data.me.chats.messages).toHaveProperty('create');

                const message = data.me.chats.messages.create;
                expect(message).toStrictEqual({
                    id: message.id,
                    text: payload.text, 
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                    memberId: member.id
                });

                expect(uuid.validate(message.id)).toBeTruthy();
                expect(uuid.version(message.id)).toEqual(4);

                expect(new Date(message.createdAt).getTime()).not.toBeNaN();
                expect(new Date(message.updatedAt).getTime()).not.toBeNaN();
            });

            it('should return 404 status when the message was send to non-exists chat', async () => {
                const [user1, user2] = users;
                const payload = { text: 'Hi', chatId: uuid.v4() };

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateMessage',
                        query: `
                            mutation CreateMessage($payload: MessageCreateDTO!) {
                                me {
                                    chats {
                                        messages {
                                            create(payload: $payload) {
                                                id text memberId createdAt updatedAt
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload 
                        }
                    });

                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(404);
            });
        });
        
        describe('[Deleting] ...', () => {
            it('should delete the message', async () => {
                const [user1, user2] = users;
                const payload = { text: 'Hi', chatId: dialog.id };

                const resCreation = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateMessage',
                        query: `
                            mutation CreateMessage($payload: MessageCreateDTO!) {
                                me {
                                    chats {
                                        messages {
                                            create(payload: $payload) {
                                                id text memberId createdAt updatedAt
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload 
                        }
                    });

                const resDeleting = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'RemoveMessage',
                        query: `
                            mutation RemoveMessage($messageId: UUID!) {
                                me {
                                    chats {
                                        messages {
                                            remove(messageId: $messageId) {
                                                id text memberId createdAt updatedAt
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            messageId: resCreation.body.data.me.chats.messages.create.id
                        }
                    });

                const member = await membersService.findOne({ 
                    where: { 
                        userId: user1.user.id,
                        chatId: dialog.id,
                        isDeleted: false
                    } 
                });

                expect(resDeleting.status).toEqual(200);

                const data = resDeleting.body.data;
                expect(data).toHaveProperty('me');
                expect(data.me).toHaveProperty('chats');
                expect(data.me.chats).toHaveProperty('messages');
                expect(data.me.chats.messages).toHaveProperty('remove');

                const message = data.me.chats.messages.remove;
                expect(message).toStrictEqual({
                    id: message.id,
                    text: payload.text, 
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                    memberId: member.id
                });

                expect(uuid.validate(message.id)).toBeTruthy();
                expect(uuid.version(message.id)).toEqual(4);

                expect(new Date(message.createdAt).getTime()).not.toBeNaN();
                expect(new Date(message.updatedAt).getTime()).not.toBeNaN();
                
                const m = await messagesService.findOne({ select: ['isDeleted'], where: { id: message.id } });
                expect(m).toHaveProperty('isDeleted', true);
            });

            it('should return 403 when the second user trying to delete not him the message', async () => {
                const [user1, user2] = users;
                const payload = { text: 'Hi', chatId: dialog.id };

                const resCreation = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateMessage',
                        query: `
                            mutation CreateMessage($payload: MessageCreateDTO!) {
                                me {
                                    chats {
                                        messages {
                                            create(payload: $payload) {
                                                id text memberId createdAt updatedAt
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload 
                        }
                    });

                const resDeleting = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user2.tokens.accessToken}`)
                    .send({
                        operationName: 'RemoveMessage',
                        query: `
                            mutation RemoveMessage($messageId: UUID!) {
                                me {
                                    chats {
                                        messages {
                                            remove(messageId: $messageId) {
                                                id text memberId createdAt updatedAt
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            messageId: resCreation.body.data.me.chats.messages.create.id
                        }
                    });
                
                expect(Array.isArray(resDeleting.body.errors)).toBeTruthy();
                expect(resDeleting.body.errors).toHaveLength(1);
                expect(resDeleting.body.errors[0].extensions.exception.status).toStrictEqual(403);
            });
        });
    });
});
