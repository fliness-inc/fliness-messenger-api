import { getRepository, getConnection, Connection } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import request from 'supertest';
import Faker from 'faker';
import * as uuid from 'uuid';
import cookieParser from 'cookie-parser';
import User from '@database/entities/user';
import AppModule from '@src/app.module';
import UsersService from '@schema/resolvers/users/users.service';
import { Tokens } from '@schema/resolvers/tokens/tokens.service';
import Invitation from '@database/entities/invitation';
import InvitationsService from '@schema/resolvers/invitations/invitations.service'
import FriendsService from '@schema/resolvers/friends/friends.service';
import { Type, Status } from '@schema/resolvers/invitations/invitations.dto';
import { InvitationStatusSeeder, InvitationStatusFactory } from '@database/seeds/invitation-status.seeder';
import { InvitationTypeSeeder, InvitationTypeFactory } from '@database/seeds/invitation-type.seeder';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [InvitationsResolver] ...', () => {
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

        await connection.synchronize(true);

        const invitationStatusSeeder = new InvitationStatusSeeder(new InvitationStatusFactory());
        await invitationStatusSeeder.run(1, { name: Status.ACCEPTED });
        await invitationStatusSeeder.run(1, { name: Status.REJECTED });
        await invitationStatusSeeder.run(1, { name: Status.WAITING });

        const invitationTypeSeeder = new InvitationTypeSeeder(new InvitationTypeFactory());
        await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_CHANNEL });
        await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_FRIENDS });
        await invitationTypeSeeder.run(1, { name: Type.INVITE_TO_GROUP });
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

        describe('[Sending] ...', () => {
            it('should send the friend invitation', async () => {
                const [sender, recipient] = users; 

                const resSend = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                    
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: recipient.user.id, 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });
    
                expect(resSend.status).toEqual(200);
    
                const resGet = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'GetInvitationFromMe',
                        query: `
                            query GetInvitationFromMe {
                                me {
                                    invitations {
                                        fromMe {
                                            id
                                            sender {
                                                id
                                            }
                                            recipient {
                                                id
                                            }
                                            type
                                            status
                                            expiresAt
                                        }
                                    }
                                }
                            }
                        `
                    });
                
                expect(resGet.status).toEqual(200);

                const data = resGet.body.data;
                expect(data).toHaveProperty('me');
                expect(data.me).toHaveProperty('invitations');
                expect(data.me.invitations).toHaveProperty('fromMe');

                const invitations = data.me.invitations.fromMe;
                expect(Array.isArray(invitations)).toBeTruthy();
                expect(invitations).toHaveLength(1);
                expect(invitations[0]).toStrictEqual({
                    id: invitations[0].id,
                    sender: { id: sender.user.id },
                    recipient: { id: recipient.user.id },
                    status: Status.WAITING,
                    type: Type.INVITE_TO_FRIENDS,
                    expiresAt: invitations[0].expiresAt
                });
    
                const resGetNew = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send({
                        operationName: 'GetInvitationForMe',
                        query: `
                            query GetInvitationForMe {
                                me {
                                    invitations {
                                        forMe {
                                            id
                                            sender {
                                                id
                                            }
                                            recipient {
                                                id
                                            }
                                            type
                                            status
                                            expiresAt
                                        }
                                    }
                                }
                            }
                        `
                    });
    
                expect(resGetNew.status).toEqual(200);

                const forMeData = resGetNew.body.data;
                expect(forMeData).toHaveProperty('me');
                expect(forMeData.me).toHaveProperty('invitations');
                expect(forMeData.me.invitations).toHaveProperty('forMe');

                const newInvitations = forMeData.me.invitations.forMe;
                expect(Array.isArray(newInvitations)).toBeTruthy();
                expect(newInvitations).toHaveLength(1);
                expect(newInvitations).toStrictEqual(invitations);
            });

            it('should return 400 status when trying to send the invitation to myself', async () => {
                const [sender, recipient] = users; 
    
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                    
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: sender.user.id, 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });
    
                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(400);
            });

            it('should return 400 status when trying to send the invitation to not-exists user', async () => {
                const [sender, recipient] = users; 
    
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                    
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: uuid.v4(), 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });
    
                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(400);
            });

            it('should return 401 status when the unauthorized user trying to send the invitation', async () => {
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                    
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: uuid.v4(), 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });
    
                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
            });

            it('should return 409 status when the user trying to send the invitation to the user that already is friend', async () => {
                const [sender, recipient] = users; 
                
                await app.get<FriendsService>(FriendsService).create({
                    userId: sender.user.id,
                    friendId: recipient.user.id,
                });
                
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                    
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: recipient.user.id, 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });
                    
                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(409);
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
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'GetInvitationFromMe',
                        query: `
                            query GetInvitationFromMe {
                                me {
                                    invitations {
                                        fromMe {
                                            id
                                        }
                                    }
                                }
                            }
                        `
                    });
    
                expect(resSender.status).toEqual(200);
                expect(Array.isArray(resSender.body.data.me.invitations.fromMe)).toBeTruthy();
                expect(resSender.body.data.me.invitations.fromMe).toHaveLength(senderNumberInvitations);
                    
                const resNewSender = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'GetInvitationForMe',
                        query: `
                            query GetInvitationForMe {
                                me {
                                    invitations {
                                        forMe {
                                            id
                                        }
                                    }
                                }
                            }
                        `
                    });
    
                expect(resNewSender.status).toEqual(200);
                expect(Array.isArray(resNewSender.body.data.me.invitations.forMe)).toBeTruthy();
                expect(resNewSender.body.data.me.invitations.forMe).toHaveLength(recipientNumberInvitations);

                const resRecipientSender = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send({
                        operationName: 'GetInvitationFromMe',
                        query: `
                            query GetInvitationFromMe {
                                me {
                                    invitations {
                                        fromMe {
                                            id
                                        }
                                    }
                                }
                            }
                        `
                    });
    
                expect(resRecipientSender.status).toEqual(200);
                expect(Array.isArray(resRecipientSender.body.data.me.invitations.fromMe)).toBeTruthy();
                expect(resRecipientSender.body.data.me.invitations.fromMe).toHaveLength(recipientNumberInvitations);
                    
                const resNewRecipient = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send({
                        operationName: 'GetInvitationForMe',
                        query: `
                            query GetInvitationForMe {
                                me {
                                    invitations {
                                        forMe {
                                            id
                                        }
                                    }
                                }
                            }
                        `
                    });
    
                expect(resNewRecipient.status).toEqual(200);
                expect(Array.isArray(resNewRecipient.body.data.me.invitations.forMe)).toBeTruthy();
                expect(resNewRecipient.body.data.me.invitations.forMe).toHaveLength(senderNumberInvitations);
            });

            it('should return 401 status when the unauthorized user trying to get the invitation', async () => {
                const res = await request(app.getHttpServer())
                .post('/graphql')
                    .send({
                        operationName: 'GetInvitationFromMe',
                        query: `
                            query GetInvitationFromMe {
                                me {
                                    invitations {
                                        fromMe {
                                            id
                                        }
                                    }
                                }
                            }
                        `
                    });
    
                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
            });

            it('should return 401 status when the unauthorized user trying to get new invitation', async () => {
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        operationName: 'GetInvitationForMe',
                        query: `
                            query GetInvitationForMe {
                                me {
                                    invitations {
                                        forMe {
                                            id
                                        }
                                    }
                                }
                            }
                        `
                    });
    
                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
            });
        });

        describe('[Accepting] ...', () => {
            it('should accept the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: recipient.user.id, 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });

                const invitationId = resSend.body.data.me.invitations.create.id;

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send({
                        operationName: 'AcceptInvitation',
                        query: `
                            mutation AcceptInvitation($invitationId: UUID!) {
                                me {
                                    invitations {
                                        accept(invitationId: $invitationId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            invitationId
                        }
                    });

                expect(res.status).toEqual(200);

                const invitation = await app.get<InvitationsService>(InvitationsService).findOne({ id: invitationId })
                
                expect(invitation).toBeDefined();
                expect(invitation.status.name).toStrictEqual(Status.ACCEPTED);
                expect(invitation.expiresAt < new Date()).toBeTruthy();
            });

            it('should return 404 status when the user trying to accept non-exists invitation', async () => {
                const [sender, recipient] = users;

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'AcceptInvitation',
                        query: `
                            mutation AcceptInvitation($invitationId: UUID!) {
                                me {
                                    invitations {
                                        accept(invitationId: $invitationId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            invitationId: uuid.v4()
                        }
                    });

                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(404);
            });

            it('should return 401 status when the unauthorized user trying to accept the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: recipient.user.id, 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });

                const invitationId = resSend.body.data.me.invitations.create.id;

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        operationName: 'AcceptInvitation',
                        query: `
                            mutation AcceptInvitation($invitationId: UUID!) {
                                me {
                                    invitations {
                                        accept(invitationId: $invitationId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            invitationId
                        }
                    });

                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
            });
        });

        describe('[Rejecting] ...', () => {
            it('should reject the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: recipient.user.id, 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });

                const invitationId = resSend.body.data.me.invitations.create.id;

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${recipient.tokens.accessToken}`)
                    .send({
                        operationName: 'RejectInvitation',
                        query: `
                            mutation RejectInvitation($invitationId: UUID!) {
                                me {
                                    invitations {
                                        reject(invitationId: $invitationId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            invitationId
                        }
                    });

                expect(res.status).toEqual(200);

                const invitation = await app.get<InvitationsService>(InvitationsService).findOne({ id: invitationId })
                
                expect(invitation).toBeDefined();
                expect(invitation.status.name).toStrictEqual(Status.REJECTED);
                expect(invitation.expiresAt < new Date()).toBeTruthy();
            });

            it('should return 404 status when the user trying to reject non-exists invitation', async () => {
                const [sender, recipient] = users;

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'RejectInvitation',
                        query: `
                            mutation RejectInvitation($invitationId: UUID!) {
                                me {
                                    invitations {
                                        reject(invitationId: $invitationId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            invitationId: uuid.v4()
                        }
                    });

                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(404);
            });

            it('should return 401 status when the unauthorized user trying to reject the invitation', async () => {
                const [sender, recipient] = users;

                const resSend = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Authorization', `Bearer ${sender.tokens.accessToken}`)
                    .send({
                        operationName: 'CreateInvitation',
                        query: `
                            mutation CreateInvitation($payload: CreateInvitationDTO!) {
                                me {
                                    invitations {
                                        create(payload: $payload) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            payload: {
                                userId: recipient.user.id, 
                                type: Type.INVITE_TO_FRIENDS
                            }
                        }
                    });

                const invitationId = resSend.body.data.me.invitations.create.id;

                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        operationName: 'RejectInvitation',
                        query: `
                            mutation RejectInvitation($invitationId: UUID!) {
                                me {
                                    invitations {
                                        reject(invitationId: $invitationId) {
                                            id
                                        }
                                    }
                                }
                            }
                        `,
                        variables: {
                            invitationId
                        }
                    });
                
                expect(Array.isArray(res.body.errors)).toBeTruthy();
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
            });
        });
    }); 
});
