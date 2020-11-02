import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection } from 'typeorm';
import User from '@database/entities/user';
import { AppModule } from '@src/app.module';
import request from 'supertest';
import Faker from 'faker';
import { ChatTypeEnum } from '@schema/resolvers/chats/chats.dto';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';
import UsersService from '@schema/resolvers/users/users.service';
import { Tokens } from '@schema/resolvers/tokens/tokens.service';
import { ChatTypeSeeder, ChatTypeFactory } from '@database/seeds/chat-type.seeder';
import { MemberRoleSeeder, MemberRoleFactory } from '@database/seeds/member-role.seeder';
import MembersService from '@schema/resolvers/members/members.service';
import Chat from '@database/entities/chat';
import ChatsService from '@schema/resolvers/chats/chats.service';
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

        describe('[Getting] [Filtering] ...', () => {

            it('should return the member of the specific id', async () => {
                const [user] = users;

                const member = members[0];
                const key = MemberPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMembers',
                        query: `
                            query GetMembers($chatsFilter: ChatsFilter, $membersFilter: MembersFilter) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                members(filter: $membersFilter) {
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
                                field: { 
                                    name: 'ID', 
                                    op: 'EQUALS', 
                                    val: dialog.id
                                }
                            }, 
                            membersFilter: {
                                field: {
                                    name: 'ID',
                                    op: 'EQUALS',
                                    val: member.id
                                }
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.members;

                expect(msgs).toStrictEqual({
                    edges: [{ 
                        cursor: CursorCoder.encode({ [key]: member.id }), 
                        node: { 
                            id: member.id, 
                            role: member.role.name, 
                            chatId: member.chatId,
                            userId: member.userId,
                            createdAt: member.createdAt.toISOString(),
                            updatedAt: member.updatedAt.toISOString()
                        } 
                    }],
                    totalCount: 1,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: member.id }),
                        endCursor: CursorCoder.encode({ [key]: member.id }),
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                });
            });

            it('should return the member of the specific role', async () => {
                const [user] = users;

                const roleMembers = members.filter(m => m.role.name === MemberRoleEnum.MEMBER);
                const key = MemberPaginationField.ID;
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${user.tokens.accessToken}`)
                    .send({
                        operationName: 'GetMembers',
                        query: `
                            query GetMembers($chatsFilter: ChatsFilter, $membersFilter: MembersFilter) {
                                me {
                                    chats(filter: $chatsFilter) {
                                        edges {
                                            node {
                                                members(filter: $membersFilter) {
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
                                field: { 
                                    name: 'ID', 
                                    op: 'EQUALS', 
                                    val: dialog.id
                                }
                            }, 
                            membersFilter: {
                                field: {
                                    name: 'ROLE_NAME',
                                    op: 'EQUALS',
                                    val: MemberRoleEnum.MEMBER
                                }
                            }
                        }
                    });

                expect(res.status).toEqual(200);

                const chat = res.body.data.me.chats.edges[0].node;
                const msgs = chat.members;

                expect(msgs).toStrictEqual({
                    edges: roleMembers.map(m => ({ 
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
                    totalCount: roleMembers.length,
                    pageInfo: {
                        startCursor: CursorCoder.encode({ [key]: roleMembers[0].id }),
                        endCursor: CursorCoder.encode({ [key]: roleMembers[roleMembers.length - 1].id }),
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                });
            });
        });
    });
});
