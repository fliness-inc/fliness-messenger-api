import { getRepository, getConnection, Connection } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import request from 'supertest';
import Faker from 'faker';
import * as uuid from 'uuid';
import cookieParser from 'cookie-parser';
import User from '@database/entities/user';
import AppModule from '@modules/app/app.module';
import UsersService from '@modules/users/users.service';
import { Tokens } from '@modules/tokens/tokens.service';
import Invitation from '@database/entities/invitation';
import { Type, Status } from '@modules/invitations/invitations.service'
import FriendsService from '@/src/modules/friends/friends.service';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [FriendsController] ...', () => {
    let app: INestApplication;
    let connection: Connection

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();

        connection = getConnection();

        await connection.query(`
            TRUNCATE 
                users, 
                tokens,
                friends,
                invitations
            CASCADE`
        );
    });

    afterEach(async () => {
        await connection.query(`
            TRUNCATE 
                friends,
                invitations
            CASCADE`
        );
    });

    afterAll(async () => {
        await connection.query(`
            TRUNCATE 
                users, 
                tokens,
            CASCADE`
        );
        await app.close();
        await connection.close();
    }); 

    describe('[Invitations] ...', () => {

        const users: { user: User, tokens: Tokens }[] = [];

        beforeAll(async () => {
            const usersService = app.get<UsersService>(UsersService);

            for (let i = 0; i < 2; ++i) {
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

        it('should send the friend invitation', async () => {
            const [sender, recipient] = users; 

            const resSend = await request(app.getHttpServer())
                .post(`/me/friends/invitation`)
                .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                .send({ userId: recipient.user.id });

            expect(resSend.status).toEqual(201);

            const resGet = await request(app.getHttpServer())
                .get(`/me/friends/invitation`)
                .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                .send();

            expect(resGet.status).toEqual(200);
            expect(Array.isArray(resGet.body)).toBeTruthy();
            expect(resGet.body).toHaveLength(1);
            expect(resGet.body[0]).toHaveProperty('id');
            expect(resGet.body[0]).toHaveProperty('senderId', sender.user.id);
            expect(resGet.body[0]).toHaveProperty('recipientId', recipient.user.id);
            expect(resGet.body[0]).toHaveProperty('status', Status.WAITING);
            expect(resGet.body[0]).toHaveProperty('type', Type.INVITE_TO_FRIENDS);
            expect(resGet.body[0]).toHaveProperty('expiresAt');

            const resGetNew = await request(app.getHttpServer())
                .get('/me/friends/invitation/new')
                .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                .send();

            expect(resGetNew.status).toEqual(200);
            expect(Array.isArray(resGetNew.body)).toBeTruthy();
            expect(resGetNew.body).toHaveLength(1);
            expect(resGetNew.body).toStrictEqual(resGet.body)
        });

        it('should return 400 status when trying to send the invitation to myself', async () => {
            const [sender, recipient] = users; 

            const resSend = await request(app.getHttpServer())
                .post(`/me/friends/invitation`)
                .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                .send({ userId: sender.user.id });

            expect(resSend.status).toEqual(400);
        });

        it('should return 400 status when trying to send the invitation to not-exists user', async () => {
            const [sender, recipient] = users; 

            const resSend = await request(app.getHttpServer())
                .post(`/me/friends/invitation`)
                .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                .send({ userId: uuid.v4() });

            expect(resSend.status).toEqual(400);
        });

        it('should return 401 status when the unauthorized user trying to send the invitation', async () => {
            const resSend = await request(app.getHttpServer())
                .post(`/me/friends/invitation`)
                .send({ userId: uuid.v4() });

            expect(resSend.status).toEqual(401);
        });

        it('should return 401 status when the unauthorized user trying to get the invitation', async () => {
            const resSend = await request(app.getHttpServer())
                .get(`/me/friends/invitation`)
                .send({ userId: uuid.v4() });

            expect(resSend.status).toEqual(401);
        });

        it('should return 401 status when the unauthorized user trying to get new invitation', async () => {
            const resSend = await request(app.getHttpServer())
                .get(`/me/friends/invitation/new`)
                .send({ userId: uuid.v4() });

            expect(resSend.status).toEqual(401);
        });

        it('should return 401 status when the user trying to send the invitation to the user that already is friend', async () => {
            const [sender, recipient] = users; 
            
            await app.get<FriendsService>(FriendsService).create({
                userId: sender.user.id,
                friendId: recipient.user.id,
            });
            
            const res = await request(app.getHttpServer())
                .post('/me/friends/invitation')
                .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                .send({ userId: recipient.user.id });

            expect(res.status).toEqual(400);
        });
    });
});
