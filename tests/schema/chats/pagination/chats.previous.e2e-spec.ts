import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection, getRepository } from 'typeorm';
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
import UserEntity from '@database/entities/user';
import ChatEntity from '@database/entities/chat';
import { CursorCoder } from '@src/pagination/cursor';
import ChatsService from '@schema/resolvers/chats/chats.service';
import { ChatPaginationField } from '@schema/models/chats.pagination';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [ChatsResolver] ...', () => {
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
        await connection.query('TRUNCATE chats, members CASCADE');

        const chatTypeSeeder = new ChatTypeSeeder(new ChatTypeFactory());
        await chatTypeSeeder.run(1, { name: ChatTypeEnum.DIALOG });
        await chatTypeSeeder.run(1, { name: ChatTypeEnum.GROUP });
        await chatTypeSeeder.run(1, { name: ChatTypeEnum.CHANNEL });

        const memberPriviliegeSeeder = new MemberRoleSeeder(new MemberRoleFactory());
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.CREATOR, weight: 1 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.ADMIN, weight: 0.5 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.MEMBER, weight: 0.1 });
    });

    afterEach(async () => {
    });

    afterAll(async () => {
        await connection.query('TRUNCATE chats, members CASCADE');
        await app.close();
        await connection.close();
    }); 

    describe('[Dialogs] ...', () => {

        const user: UserEntity = <any>{};
        const tokens: Tokens = <any>{}
        let chats: ChatEntity[] = [];
    
        beforeAll(async () => {
            const usersService = app.get<UsersService>(UsersService);
            const users: { user: UserEntity, password: string }[] = [];

            for (let i = 0; i < 11; ++i) {
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
                        payload: {
                            email: user.email,
                            password: users[0].password
                        }
                    }
                });

            Object.assign(tokens, res.body.data.auth.login);

            const chatsService = app.get<ChatsService>(ChatsService);
            for (let i = 1; i < users.length; ++i)
                chats.push(await chatsService
                    .create(user.id, ChatTypeEnum.DIALOG, { userIds: [users[i].user.id] }));
                
            chats = chats.sort((f, s) => (f.id > s.id ? 1 : f.id < s.id ? -1 : 0));
        });
        
        describe('[Getting] [Pagination] [Previous] ...', () => {

            // start ... [] [] [] [] [] end
            it('should return the last 5 chats of the user', async () => {
                const last = 5;
                const key = ChatPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${tokens.accessToken}`)
                    .send({
                        operationName: 'GetChats',
                        query: `
                            query GetChats($pagination: ChatPaginationInput) {
                                me {
                                    chats(pagination: $pagination) {
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
                        `,
                        variables: {
                            pagination: {
                                last
                            }
                        }
                    });

                expect(res.status).toEqual(200);
                expect(res.body).toStrictEqual({
                    data: {
                        me: {
                            chats: {
                                edges: chats.slice(chats.length-last, chats.length).map(chat => ({ 
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
                                    endCursor: CursorCoder.encode({ [key]: chats[chats.length - 1].id }),
                                    hasNextPage: false,
                                    hasPreviousPage: true
                                }
                            }
                        }
                    }
                });
                expect(res.body.data.me.chats.edges).toHaveLength(last);
            });

            // start ... [] [] [] [] [] ... end
            it('should return the last 5 chats after the second (8) chats of the end', async () => {
                const last = 5;
                const key = ChatPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${tokens.accessToken}`)
                    .send({
                        operationName: 'GetChats',
                        query: `
                            query GetChats($pagination: ChatPaginationInput) {
                                me {
                                    chats(pagination: $pagination) {
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
                        `,
                        variables: {
                            pagination: {
                                last,
                                before: CursorCoder.encode({ [key]: chats[chats.length-2].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);
                expect(res.body).toStrictEqual({
                    data: {
                        me: {
                            chats: {
                                edges: chats.slice(chats.length-last-2, chats.length-2).map(chat => ({ 
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
                                    endCursor: CursorCoder.encode({ [key]: chats[chats.length - 1].id }),
                                    hasNextPage: true,
                                    hasPreviousPage: true
                                }
                            }
                        }
                    }
                });
                expect(res.body.data.me.chats.edges).toHaveLength(last);
            });

            // start [] [] [] [] [] ... end
            it('should return the last 5 chats of the user', async () => {
                const last = 5;
                const key = ChatPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${tokens.accessToken}`)
                    .send({
                        operationName: 'GetChats',
                        query: `
                            query GetChats($pagination: ChatPaginationInput) {
                                me {
                                    chats(pagination: $pagination) {
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
                        `,
                        variables: {
                            pagination: {
                                last,
                                before: CursorCoder.encode({ [key]: chats[5].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);
                expect(res.body).toStrictEqual({
                    data: {
                        me: {
                            chats: {
                                edges: chats.slice(0, chats.length-5).map(chat => ({ 
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
                                    endCursor: CursorCoder.encode({ [key]: chats[chats.length - 1].id }),
                                    hasNextPage: true,
                                    hasPreviousPage: false
                                }
                            }
                        }
                    }
                });
                expect(res.body.data.me.chats.edges).toHaveLength(last);
            });

            // start [] [] ... end
            it('should return the last 5 chats of the user after the third of the end', async () => {
                const last = 5;
                const key = ChatPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${tokens.accessToken}`)
                    .send({
                        operationName: 'GetChats',
                        query: `
                            query GetChats($pagination: ChatPaginationInput) {
                                me {
                                    chats(pagination: $pagination) {
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
                        `,
                        variables: {
                            pagination: {
                                last,
                                before: CursorCoder.encode({ [key]: chats[2].id })
                            }
                        }
                    });

                expect(res.status).toEqual(200);
                expect(res.body).toStrictEqual({
                    data: {
                        me: {
                            chats: {
                                edges: chats.slice(0, chats.length-last-3).map(chat => ({ 
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
                                    endCursor: CursorCoder.encode({ [key]: chats[chats.length - 1].id }),
                                    hasNextPage: true,
                                    hasPreviousPage: false
                                }
                            }
                        }
                    }
                });
                expect(res.body.data.me.chats.edges).toHaveLength(2);
            });
        });
    });
});
