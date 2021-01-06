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
import { MemberRoleSeeder, MemberRoleFactory } from '@database/seeds/member-role.seeder';
import { UserPaginationField } from '@schema/models/users/users.model.pagination';
import { CursorCoder } from '@src/pagination/cursor';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [UsersResolver] ...', () => {
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

    afterAll(async () => {
        await connection.close();
        await app.close();
    }); 

    describe('[Users] ...', () => {

        let usersService: UsersService;

        const users: { user: User, tokens: Tokens }[] = [];
        let sortedUsers: { user: User, tokens: Tokens }[] = [];
    
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

            sortedUsers = users
                    .sort((f, s) => (
                        f.user.id > s.user.id ? 1 : 
                        f.user.id < s.user.id ? -1 : 0
                    ));
        });

        describe('[Getting] [Pagination] [All] ...', () => {
            it('should return all users', async () => {
                const [user1, user2] = users;

                const key = UserPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user1.tokens.accessToken}`)
                    .send({
                        query: `
                            query {
                                users {
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
                        `
                    });

                expect(res.status).toEqual(200);
                expect(res.body).toStrictEqual({
                    data: {
                        users: {
                            edges: sortedUsers.map(({ user }) => ({ 
                                cursor: CursorCoder.encode({ [key]: user.id }), 
                                node: { 
                                    id: user.id, 
                                    name: user.name, 
                                    email: user.email 
                                } 
                            })),
                            totalCount: sortedUsers.length,
                            pageInfo: {
                                startCursor: CursorCoder.encode({ [key]: sortedUsers[0].user.id }),
                                endCursor: CursorCoder.encode({ [key]: sortedUsers[sortedUsers.length - 1].user.id }),
                                hasNextPage: false,
                                hasPreviousPage: false
                            }
                        }
                    }
                });
            });
        });
    });
});
