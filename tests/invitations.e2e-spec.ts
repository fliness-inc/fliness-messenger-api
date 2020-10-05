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
import InvitationsService from '@modules/invitations/invitations.service'
import FriendsService from '@modules/friends/friends.service';
import { Type, Status } from '@modules/invitations/invitations.dto';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [InvitationsController] ...', () => {
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

    describe('[Friends] ...', () => {

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

        describe('[Sending] ...', () => {
            it('should send the friend invitation', async () => {
                const [sender, recipient] = users; 
    
                const resSend = await request(app.getHttpServer())
                    .post(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: recipient.user.id });
    
                expect(resSend.status).toEqual(201);
    
                const resGet = await request(app.getHttpServer())
                    .get(`/me/friends/invitations`)
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
                    .get('/me/friends/invitations/new')
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
                    .post(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: sender.user.id });
    
                expect(resSend.status).toEqual(400);
            });

            it('should return 400 status when trying to send the invitation to not-exists user', async () => {
                const [sender, recipient] = users; 
    
                const resSend = await request(app.getHttpServer())
                    .post(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: uuid.v4() });
    
                expect(resSend.status).toEqual(400);
            });

            it('should return 401 status when the unauthorized user trying to send the invitation', async () => {
                const resSend = await request(app.getHttpServer())
                    .post(`/me/friends/invitations`)
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
                    .post('/me/friends/invitations')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: recipient.user.id });
    
                expect(res.status).toEqual(400);
            });
        });

        describe('[Getting] ...', () => {
            it('should return invitations', async () => {
                const [sender, recipient] = users;
                const senderNumberInvitations = 2;
                const recipientNumberInvitations = 3;

                for (let i = 0; i < senderNumberInvitations; ++i) 
                    await app.get<InvitationsService>(InvitationsService).create(sender.user.id, recipient.user.id, Type.INVITE_TO_FRIENDS);
                
                for (let i = 0; i < recipientNumberInvitations; ++i)
                    await app.get<InvitationsService>(InvitationsService).create(recipient.user.id, sender.user.id, Type.INVITE_TO_FRIENDS);
            
                const resSender = await request(app.getHttpServer())
                    .get(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send();
    
                expect(resSender.status).toEqual(200);
                expect(Array.isArray(resSender.body)).toBeTruthy();
                expect(resSender.body).toHaveLength(senderNumberInvitations);
                    
                const resNewSender = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/new`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send();
    
                expect(resNewSender.status).toEqual(200);
                expect(Array.isArray(resNewSender.body)).toBeTruthy();
                expect(resNewSender.body).toHaveLength(recipientNumberInvitations);

                const resRecipientSender = await request(app.getHttpServer())
                    .get(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send();
    
                expect(resRecipientSender.status).toEqual(200);
                expect(Array.isArray(resRecipientSender.body)).toBeTruthy();
                expect(resRecipientSender.body).toHaveLength(recipientNumberInvitations);
                    
                const resNewRecipient = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/new`)
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send();
    
                expect(resNewRecipient.status).toEqual(200);
                expect(Array.isArray(resNewRecipient.body)).toBeTruthy();
                expect(resNewRecipient.body).toHaveLength(senderNumberInvitations);
            });

            it('should return 401 status when the unauthorized user trying to get the invitation', async () => {
                const resSend = await request(app.getHttpServer())
                    .get(`/me/friends/invitations`)
                    .send({ userId: uuid.v4() });
    
                expect(resSend.status).toEqual(401);
            });

            it('should return 401 status when the unauthorized user trying to get new invitation', async () => {
                const resSend = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/new`)
                    .send({ userId: uuid.v4() });
    
                expect(resSend.status).toEqual(401);
            });
        });

        describe('[Accepting] ...', () => {
            it('should accept the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: recipient.user.id });

                const invitationId = resSend.body.id;

                const res = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/${invitationId}/accept`)
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send();

                expect(res.status).toEqual(200);

                const invitation = await app.get<InvitationsService>(InvitationsService).findOne({ id: invitationId })
                
                expect(invitation).toBeDefined();
                expect(invitation.status.name).toStrictEqual(Status.ACCEPTED);
                expect(invitation.expiresAt < new Date()).toBeTruthy();
            });

            it('should return 404 status when the user trying to accept non-exists invitation', async () => {
                const [sender, recipient] = users;

                const res = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/${uuid.v4()}/accept`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send();

                expect(res.status).toStrictEqual(404);
            });

            it('should return 401 status when the unauthorized user trying to accept the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: recipient.user.id });

                const invitationId = resSend.body.id;

                const res = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/${invitationId}/accept`)
                    .send();
                
                expect(res.status).toEqual(401);
            });
        });

        describe('[Rejecting] ...', () => {
            it('should reject the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: recipient.user.id });

                const invitationId = resSend.body.id;

                const res = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/${invitationId}/reject`)
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send();

                expect(res.status).toEqual(200);

                const invitation = await app.get<InvitationsService>(InvitationsService).findOne({ id: invitationId })
                
                expect(invitation).toBeDefined();
                expect(invitation.status.name).toStrictEqual(Status.REJECTED);
                expect(invitation.expiresAt < new Date()).toBeTruthy();
            });

            it('should return 404 status when the user trying to reject non-exists invitation', async () => {
                const [sender, recipient] = users;

                const res = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/${uuid.v4()}/reject`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send();

                expect(res.status).toStrictEqual(404);
            });

            it('should return 401 status when the unauthorized user trying to reject the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post(`/me/friends/invitations`)
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({ userId: recipient.user.id });

                const invitationId = resSend.body.id;

                const res = await request(app.getHttpServer())
                    .get(`/me/friends/invitations/${invitationId}/reject`)
                    .send();
                
                expect(res.status).toEqual(401);
            });
        });
    });
});
