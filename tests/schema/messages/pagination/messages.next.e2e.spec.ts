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
import { MemberRoleSeeder, MemberRoleFactory } from '@/src/database/seeds/member-role.seeder';
import MembersService from '@schema/resolvers/members/members.service';
import Chat from '@database/entities/chat';
import ChatsService from '@schema/resolvers/chats/chats.service';
import MessagesService from '@schema/resolvers/messages/messages.service';
import Message from '@database/entities/message';
import { MessagePaginationField } from '@schema/models/messages.pagination';
import { CursorCoder } from '@src/pagination/cursor';

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
        //await connection.query('TRUNCATE messages CASCADE');
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
        let messages: Message[] = [];
    
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

            for (let i = 0; i < 5; ++i) {
                messages.push(
                    await messagesService.create(users[0].user.id, dialog.id, { text: Faker.random.words() }));
                messages.push(
                    await messagesService.create(users[1].user.id, dialog.id, { text: Faker.random.words() }));
            }

            messages = messages.sort((f, s) => (f.id > s.id ? 1 : f.id < s.id ? -1 : 0));
        });

        describe('[Getting] [Pagination] [Next] ...', () => {

            // start [] [] [] [] [] ... end
            it('should return the first 5 messages of the chat', async () => {
                const [user1, user2] = users;

                const first = 5;
                const key = MessagePaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMessages',
                        query: `
                            query GetMessages($chatsFilter: ChatsFilter, $messagePagination: MessagePaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                messages(pagination: $messagePagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            text
                                                            memberId
                                                            createdAt
                                                            updatedAt
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
                                    }
                                }
                            }
                        `,
                        variables: {
                            chatsFilter: {
                                field: { 
                                    name: 'ID', 
                                    op: 'EQUALS', 
                                    val: dialog.id
                                }
                            },
                            messagePagination: {
                                first
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.messages;

                expect(msgs).toStrictEqual({
                    edges: messages.slice(0, 5).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            text: m.text, 
                            memberId: m.memberId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: messages.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: messages[0].id }),
                        endCursor: CursorCoder.encode({ [key]: messages[messages.length - 1].id }),
                        hasNextPage: true,
                        hasPreviousPage: false
                    }
                });
            });

            // start ... [] [] [] [] [] ... end
            it('should return the first 5 chats after the second message of the chat', async () => {
                const [user1, user2] = users;

                const first = 5;
                const key = MessagePaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMessages',
                        query: `
                            query GetMessages($chatsFilter: ChatsFilter, $messagePagination: MessagePaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                messages(pagination: $messagePagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            text
                                                            memberId
                                                            createdAt
                                                            updatedAt
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
                                    }
                                }
                            }
                        `,
                        variables: {
                            chatsFilter: {
                                field: { 
                                    name: 'ID', 
                                    op: 'EQUALS', 
                                    val: dialog.id
                                }
                            },
                            messagePagination: {
                                first,
                                after: CursorCoder.encode({ [key]: messages[1].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.messages;

                expect(msgs).toStrictEqual({
                    edges: messages.slice(2, first+2).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            text: m.text, 
                            memberId: m.memberId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: messages.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: messages[0].id }),
                        endCursor: CursorCoder.encode({ [key]: messages[messages.length - 1].id }),
                        hasNextPage: true,
                        hasPreviousPage: true
                    }
                });
            });

            // start ... [] [] [] [] [] end
            it('should return the last 5 messages of the chat', async () => {
                const [user1, user2] = users;

                const first = 5;
                const key = MessagePaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMessages',
                        query: `
                            query GetMessages($chatsFilter: ChatsFilter, $messagePagination: MessagePaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                messages(pagination: $messagePagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            text
                                                            memberId
                                                            createdAt
                                                            updatedAt
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
                                    }
                                }
                            }
                        `,
                        variables: {
                            chatsFilter: {
                                field: { 
                                    name: 'ID', 
                                    op: 'EQUALS', 
                                    val: dialog.id
                                }
                            },
                            messagePagination: {
                                first,
                                after: CursorCoder.encode({ [key]: messages[4].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.messages;

                expect(msgs).toStrictEqual({
                    edges: messages.slice(5, first+5).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            text: m.text, 
                            memberId: m.memberId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: messages.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: messages[0].id }),
                        endCursor: CursorCoder.encode({ [key]: messages[messages.length - 1].id }),
                        hasNextPage: false,
                        hasPreviousPage: true
                    }
                });
            });

            // start ... [] [] end
            it('should return the last 5 messages of the chat after the third of the end', async () => {
                const [user1, user2] = users;

                const first = 5;
                const key = MessagePaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMessages',
                        query: `
                            query GetMessages($chatsFilter: ChatsFilter, $messagePagination: MessagePaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                messages(pagination: $messagePagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            text
                                                            memberId
                                                            createdAt
                                                            updatedAt
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
                                    }
                                }
                            }
                        `,
                        variables: {
                            chatsFilter: {
                                field: { 
                                    name: 'ID', 
                                    op: 'EQUALS', 
                                    val: dialog.id
                                }
                            },
                            messagePagination: {
                                first,
                                after: CursorCoder.encode({ [key]: messages[7].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.messages;

                expect(msgs).toStrictEqual({
                    edges: messages.slice(8, first+8).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            text: m.text, 
                            memberId: m.memberId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: messages.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: messages[0].id }),
                        endCursor: CursorCoder.encode({ [key]: messages[messages.length - 1].id }),
                        hasNextPage: false,
                        hasPreviousPage: true
                    }
                });
            });
        });
    });
});