import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { getConnection, Connection, getRepository } from 'typeorm';
import { User } from '@database/entities/user';
import { AppModule } from '@modules/app/app.module';
import request from 'supertest';
import * as uuid from 'uuid';
import Faker from 'faker';
import { ChatTypeEnum } from '@modules/chats/chats.dto';
import { MemberRoleNameEnum } from '@modules/members/members.dto';
import UsersService from '@modules/users/users.service';
import { Tokens } from '@modules/tokens/tokens.service';
import { ChatTypeSeeder, ChatTypeFactory } from '@database/seeds/chat-type.seeder';
import { MemberRoleSeeder, MemberRoleFactory } from '@database/seeds/member-role';
import Member from '@database/entities/member';
import Chat from '@database/entities/chat';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [ChatController] ...', () => {
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
        await memberPriviliegeSeeder.run(1, { name: MemberRoleNameEnum.CREATOR, weight: 1 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleNameEnum.ADMIN, weight: 0.5 });
        await memberPriviliegeSeeder.run(1, { name: MemberRoleNameEnum.MEMBER, weight: 0.1 });
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
                    .post('/auth/login')
                    .send(payload);
                users.push({ 
                    user,
                    tokens: res.body
                });
            }
        });

        describe('[Creating] ...', () => {
            it('should create the chat', async () => {
                const [creator, companion] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: [companion.user.id]
                    });

                expect(res.status).toEqual(201);
                expect(res.body).toHaveProperty('id');
                expect(uuid.validate(res.body.id)).toBeTruthy();
                expect(uuid.version(res.body.id)).toEqual(4);
                expect(res.body).toHaveProperty('title', null);
                expect(res.body).toHaveProperty('description', null);
                expect(res.body).toHaveProperty('createdAt');
                expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();
                expect(res.body).toHaveProperty('type', ChatTypeEnum.DIALOG);
                expect(await getRepository(Member).count()).toEqual(2);
                expect(await getRepository(Chat).count()).toEqual(1);
            });
            it('should create the chat when the userIds property contain the creator id and the id of the second user', async () => {
                const [creator, companion] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: [creator.user.id, companion.user.id]
                    });
    
                expect(res.status).toEqual(201);
                expect(await getRepository(Member).count()).toEqual(2);
                expect(await getRepository(Chat).count()).toEqual(1);
            });
            it('should return 400 when the type property was not specified', async () => {
                const [creator, companion] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        userIds: [companion.user.id]
                    });
    
                expect(res.status).toEqual(400);
                expect(await getRepository(Member).count()).toEqual(0);
                expect(await getRepository(Chat).count()).toEqual(0);
            });
            it('should return 400 when the type property contain invalid value', async () => {
                const [creator, companion] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: Faker.random.word(),
                        userIds: [companion.user.id]
                    });
    
                expect(res.status).toEqual(400);
                expect(await getRepository(Member).count()).toEqual(0);
                expect(await getRepository(Chat).count()).toEqual(0);
            });
            it('should return 400 when the userIds property not contain the second user', async () => {
                const [creator, companion] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: []
                    });
    
                expect(res.status).toEqual(400);
                expect(await getRepository(Member).count()).toEqual(0);
                expect(await getRepository(Chat).count()).toEqual(0);
            });
            it('should return 400 when the userIds property contain invalid value', async () => {
                const [creator, companion] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: null
                    });
    
                expect(res.status).toEqual(400);
                expect(await getRepository(Member).count()).toEqual(0);
                expect(await getRepository(Chat).count()).toEqual(0);
            });
            it('should return 409 when the userIds property contain more one member id and not contain  the creator id', async () => {
                const [creator, companion, otherUser] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: [companion.user.id, otherUser.user.id]
                    });
    
                expect(res.status).toEqual(409);
                expect(await getRepository(Member).count()).toEqual(0);
                expect(await getRepository(Chat).count()).toEqual(0);
            });
            it('should return 401 when the unauthorized user trying to create new dialog', async () => {
                const [creator, companion] = users;
    
                const res = await request(app.getHttpServer())
                    .post('/me/chats')
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: [companion.user.id]
                    });
    
                expect(res.status).toEqual(401);
                expect(await getRepository(Member).count()).toEqual(0);
                expect(await getRepository(Chat).count()).toEqual(0);
            });
        });
        describe('[Deleting] ...', () => {
            it('should delete the chat', async () => {
                const [creator, companion] = users;
    
                const { body: chat } = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: [companion.user.id]
                    });

                const res = await request(app.getHttpServer())
                    .delete(`/me/chats/${chat.id}`)
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send();

                expect(res.status).toEqual(200);
                expect(await getRepository(Chat).count()).toEqual(1);
                expect(await getRepository(Chat).count({ where: { isDeleted: true } })).toEqual(1);
            });
            it('should return the 403 status when a non-Creator user tries to delete the chat', async () => {
                const [creator, companion] = users;
    
                const { body: chat } = await request(app.getHttpServer())
                    .post('/me/chats')
                    .set('Authorization', `Bearer ${creator.tokens.accessToken}`)
                    .send({
                        type: ChatTypeEnum.DIALOG,
                        userIds: [companion.user.id]
                    });

                const res = await request(app.getHttpServer())
                    .delete(`/me/chats/${chat.id}`)
                    .set('Authorization', `Bearer ${companion.tokens.accessToken}`)
                    .send();

                expect(res.status).toEqual(403);
                expect(await getRepository(Chat).count({ where: { isDeleted: false } })).toEqual(1);
                expect(await getRepository(Chat).count({ where: { isDeleted: true } })).toEqual(0);
            });
        });
    });
});
