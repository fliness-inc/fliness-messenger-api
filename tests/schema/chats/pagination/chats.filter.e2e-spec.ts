import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection, getRepository } from 'typeorm';
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
import { ChatSeeder, ChatFactory } from '@database/seeds/chat.seeder';
import Member from '@database/entities/member';
import Chat from '@database/entities/chat';
import ChatsService from '@/src/schema/resolvers/chats/chats.service';
import { ChatPaginationField } from '@schema/models/chats.pagination';
import { CursorCoder } from '@src/pagination/cursor';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [ChatResolver] ...', () => {
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
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.CREATOR, weight: 1 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.ADMIN, weight: 0.5 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleEnum.MEMBER, weight: 0.1 });
    });

    afterEach(async () => {
        await connection.query('TRUNCATE chats, members CASCADE');
    });

    afterAll(async () => {
        await app.close();
        await connection.close();
    }); 

    describe('[Dialogs] ...', () => {

        const users: { user: User, tokens: Tokens }[] = [];
    
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
        });

        describe('[Filter] ...', () => {

            it('should return the chats of the DIALOG type', async () => {
                const [creator, companion] = users;

                let chats = []; 
                const chatsService = app.get<ChatsService>(ChatsService);
                for (let i = 1; i < users.length; ++i)
                    chats.push(await chatsService
                        .create(creator.user.id, ChatTypeEnum.DIALOG, { userIds: [users[i].user.id] }));
                    
                chats = chats.sort((f, s) => (f.id > s.id ? 1 : f.id < s.id ? -1 : 0));
    
                const key = ChatPaginationField.ID.replace('.', '_');
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        operationName: 'GetChats',
                        query: `
                            query GetChats {
                                me {
                                    chats {
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
                                    } 
                                })),
                                totalCount: chats.length,
                                pageInfo: {
                                    startCursor: CursorCoder.encode({ [key]: chats[0].id }),
                                    endCursor: CursorCoder.encode({ [key]: chats[chats.length - 1].id }),
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
