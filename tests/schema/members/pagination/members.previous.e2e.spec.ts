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
import Message from '@database/entities/message';
import { MemberPaginationField } from '@schema/models/members.pagination';
import { CursorCoder } from '@src/pagination/cursor';
import Member from '@database/entities/member';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [MembersResolver] ...', () => {
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
    });

    afterAll(async () => {
        await app.close();
        await connection.close();
    }); 

    describe('', () => {

        let usersService: UsersService;
        let chatsService: ChatsService;
        let membersService: MembersService;

        const users: { user: User, tokens: Tokens }[] = [];
        let dialog: Chat;
        let members: Member[] = [];
    
        beforeAll(async () => {
            usersService = app.get<UsersService>(UsersService);
            chatsService = app.get<ChatsService>(ChatsService);
            membersService = app.get<MembersService>(MembersService);

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
                ChatTypeEnum.GROUP
            );

            members.push(
                await membersService.findOne({ 
                    where: {
                        userId: users[0].user.id,
                        chatId: dialog.id
                    }
                })
            );

            for (let i = 1; i < 10; ++i) {
                members.push(
                    await membersService.create(users[i].user.id, dialog.id, MemberRoleEnum.MEMBER));
            }

            members = members.sort((f, s) => (f.id > s.id ? 1 : f.id < s.id ? -1 : 0));
        });

        describe('[Getting] [Pagination] [Previous] ...', () => {

            // start ... [] [] [] [] [] end
            it('should return the last 5 members of the chat', async () => {
                const [user] = users;

                const last = 5;
                const key = MemberPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMembers',
                        query: `
                            query GetMembers($chatsFilter: ChatsFilter, $membersPagination: MemberPaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                members(pagination: $membersPagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            chatId
                                                            userId
                                                            role
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
                                id: dialog.id
                            },
                            membersPagination: {
                                last
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.members;

                expect(msgs).toStrictEqual({
                    edges: members.slice(members.length-last, members.length).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            role: m.role.name, 
                            chatId: m.chatId,
                            userId: m.userId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: members.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: members[0].id }),
                        endCursor: CursorCoder.encode({ [key]: members[members.length - 1].id }),
                        hasNextPage: false,
                        hasPreviousPage: true
                    }
                });
            });

            // start ... [] [] [] [] [] end
            it('should return the last 5 member after the second (8) member of the end', async () => {
                const [user] = users;

                const last = 5;
                const key = MemberPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMembers',
                        query: `
                            query GetMembers($chatsFilter: ChatsFilter, $membersPagination: MemberPaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                members(pagination: $membersPagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            chatId
                                                            userId
                                                            role
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
                                id: dialog.id
                            },
                            membersPagination: {
                                last,
                                before: CursorCoder.encode({ [key]: members[members.length-2].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.members;

                expect(msgs).toStrictEqual({
                    edges: members.slice(members.length-last-2, members.length-2).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            role: m.role.name, 
                            chatId: m.chatId,
                            userId: m.userId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: members.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: members[0].id }),
                        endCursor: CursorCoder.encode({ [key]: members[members.length - 1].id }),
                        hasNextPage: true,
                        hasPreviousPage: true
                    }
                });
            });

            // start [] [] [] [] [] ... end
            it('should return the last 5 members of the chat', async () => {
                const [user] = users;

                const last = 5;
                const key = MemberPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMembers',
                        query: `
                            query GetMembers($chatsFilter: ChatsFilter, $membersPagination: MemberPaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                members(pagination: $membersPagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            chatId
                                                            userId
                                                            role
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
                                id: dialog.id
                            },
                            membersPagination: {
                                last,
                                before: CursorCoder.encode({ [key]: members[5].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.members;

                expect(msgs).toStrictEqual({
                    edges: members.slice(0, members.length-5).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            role: m.role.name, 
                            chatId: m.chatId,
                            userId: m.userId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: members.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: members[0].id }),
                        endCursor: CursorCoder.encode({ [key]: members[members.length - 1].id }),
                        hasNextPage: true,
                        hasPreviousPage: false
                    }
                });
            });

            // start [] [] ... end
            it('should return the last 5 members of the chat after the third of the end', async () => {
                const [user] = users;

                const last = 5;
                const key = MemberPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMembers',
                        query: `
                            query GetMembers($chatsFilter: ChatsFilter, $membersPagination: MemberPaginationInput) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                members(pagination: $membersPagination) {
                                                    edges {
                                                        cursor
                                                        node {
                                                            id
                                                            chatId
                                                            userId
                                                            role
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
                                id: dialog.id
                            },
                            membersPagination: {
                                last,
                                before: CursorCoder.encode({ [key]: members[2].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.members;

                expect(msgs).toStrictEqual({
                    edges: members.slice(0, members.length-last-3).map(m => ({ 
                        cursor: CursorCoder.encode({ [key]: m.id }), 
                        node: { 
                            id: m.id, 
                            role: m.role.name, 
                            chatId: m.chatId,
                            userId: m.userId,
                            createdAt: m.createdAt.toISOString(),
                            updatedAt: m.updatedAt.toISOString()
                        } 
                    })),
                    totalCount: members.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: members[0].id }),
                        endCursor: CursorCoder.encode({ [key]: members[members.length - 1].id }),
                        hasNextPage: true,
                        hasPreviousPage: false
                    }
                });
            });
        });
    });
});
