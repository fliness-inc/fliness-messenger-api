import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import { getRepository, Connection, getConnection } from 'typeorm';
import { User } from '@database/entities/user';
import { AppModule } from '@src/app.module';
import request from 'supertest';
import * as uuid from 'uuid';
import Faker from 'faker';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [AuthResolver] ...', () => {
    let app: INestApplication;
    let connection: Connection;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());

        connection = getConnection();

        await app.init();
        await connection.synchronize(true);
    });

    afterEach(async () => {
        await connection.query('TRUNCATE users, tokens CASCADE');
    });

    afterAll(async () => {
        await app.close();
        await connection.close();
    }); 

    describe('[Login] ...', () => {
        it('should authorize the user and return the access and refresh tokens', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload
            }));
    
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

            expect(res.headers).toHaveProperty('set-cookie');
            expect(res.headers['set-cookie']).toHaveLength(1);
    
            const cookieParams = (<string>res.headers['set-cookie'][0]).split('; ');
            expect(cookieParams).toHaveLength(5);
    
            const [, jwtToken] = cookieParams[0].split('=');
            expect(uuid.validate(jwtToken)).toBeTruthy();
            expect(uuid.version(jwtToken)).toStrictEqual(4);
    
            const [, maxAge] = cookieParams[1].split('=');
            expect(Number.parseInt(maxAge)).toStrictEqual(60 * 60 * 24 * 60);
    
            const [, path] = cookieParams[2].split('=');
            expect(path).toStrictEqual('/');
    
            const httpOnly = cookieParams[4];
            expect(httpOnly).toStrictEqual('HttpOnly');
    
            const data = res.body.data;
            expect(data).toHaveProperty('auth');
            expect(data.auth).toHaveProperty('login');
            expect(data.auth.login).toHaveProperty('accessToken');
            expect(data.auth.login).toHaveProperty('refreshToken', jwtToken);
        });
    
        it('should return 401 status when trying to get profile information without access token', async () => {
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
                        query {
                            me {
                                id
                                email
                            }
                        }
                    `
                });
    
            expect(Array.isArray(res.body.errors)).toBeTruthy();
            expect(res.body.errors).toHaveLength(1);
            expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
        });
    
        it('should return 401 status when trying to get profile information with expired access token', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload,
            }));

            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${app.get(JwtService).sign({ id: user.id }, { expiresIn: 0 })}`)
                .send({
                    query: `
                        query {
                            me {
                                id
                                email
                            }
                        }
                    `
                });
    
            expect(Array.isArray(res.body.errors)).toBeTruthy();
            expect(res.body.errors).toHaveLength(1);
            expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
        });
    
        it('should return 401 status when the user was not found', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };

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
    
            expect(Array.isArray(res.body.errors)).toBeTruthy();
            expect(res.body.errors).toHaveLength(1);
            expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
        });
    
        it('should return 401 status when the user password was not found', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload,
                password: 'another password'
            }));
    
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
    
            expect(Array.isArray(res.body.errors)).toBeTruthy();
            expect(res.body.errors).toHaveLength(1);
            expect(res.body.errors[0].extensions.exception.status).toStrictEqual(401);
        });
    
        it('should provide access to profile information after successful authorization', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload
            }));
    
            const resLogin = await request(app.getHttpServer())
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
                
            const tokens = resLogin.body.data.auth.login;

            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${tokens.accessToken}`)
                .send({
                    query: `
                        query {
                            me {
                                id
                                email
                            }
                        }
                    `
                });
    
            expect(res.body.data).toHaveProperty('me', { id: user.id, email: user.email });
        });
    });

    describe('[Registration] ...', () => {
        it('should provide access to profile information after successful registration', async () => {
            const payload = { 
                name: Faker.internet.userName(),
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const resRegister = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
                        mutation($payload: AuthRegisterDTO!) {
                            auth {
                                register(payload: $payload) {
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
                
            const tokens = resRegister.body.data.auth.register;
    
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${tokens.accessToken}`)
                .send({
                    query: `
                        query {
                            me {
                                id
                                email
                                name
                            }
                        }
                    `
                });
    
            expect(res.body.data).toHaveProperty('me');
            expect(res.body.data.me).toHaveProperty('email', payload.email);
            expect(res.body.data.me).toHaveProperty('name', payload.name);
        });
    });

    describe('[Refresh Tokens] ...', () => {
        it('should refresh the tokens', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload
            }));
    
            const resLogin = await request(app.getHttpServer())
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
                
            const tokens = resLogin.body.data.auth.login;

            const resRefresh = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', `jwt-token=${tokens.refreshToken}`)
                .send({
                    query: `
                        mutation {
                            auth {
                                refresh {
                                    accessToken
                                    refreshToken
                                }
                            }
                        }
                    `
                });

            expect(resRefresh.headers).toHaveProperty('set-cookie');
            expect(resRefresh.headers['set-cookie']).toHaveLength(1);
    
            const cookieParams = (<string>resRefresh.headers['set-cookie'][0]).split('; ');
            expect(cookieParams).toHaveLength(5);
    
            const [, jwtToken] = cookieParams[0].split('=');
            expect(uuid.validate(jwtToken)).toBeTruthy();
            expect(uuid.version(jwtToken)).toStrictEqual(4);
    
            const [, maxAge] = cookieParams[1].split('=');
            expect(Number.parseInt(maxAge)).toStrictEqual(60 * 60 * 24 * 60);
    
            const [, path] = cookieParams[2].split('=');
            expect(path).toStrictEqual('/');
    
            const httpOnly = cookieParams[4];
            expect(httpOnly).toStrictEqual('HttpOnly');
    
            const data = resRefresh.body.data;
            expect(data).toHaveProperty('auth');
            expect(data.auth).toHaveProperty('refresh');
            expect(data.auth.refresh).toHaveProperty('accessToken');
            expect(data.auth.refresh).toHaveProperty('refreshToken', jwtToken);

            const resMe = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${resRefresh.body.data.auth.refresh.accessToken}`)
                .send({
                    query: `
                        query {
                            me {
                                id
                                email
                                name
                            }
                        }
                    `
                });
    
            expect(resMe.body.data).toHaveProperty('me');
            expect(resMe.body.data.me).toHaveProperty('email', payload.email);
        });

        it('should return 401 status when trying to refresh tokens with the expired refresh token', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload
            }));
    
            const resFirstLogin = await request(app.getHttpServer())
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

            const firstTokens = resFirstLogin.body.data.auth.login;

            const resSecondLogin = await request(app.getHttpServer())
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
                
            const secondTokens = resFirstLogin.body.data.auth.login;
    
            const resRefresh = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', `jwt-token=${firstTokens.refreshToken}`)
                .send({
                    query: `
                        mutation {
                            auth {
                                refresh {
                                    accessToken
                                    refreshToken
                                }
                            }
                        }
                    `
                });

            expect(Array.isArray(resRefresh.body.errors)).toBeTruthy();
            expect(resRefresh.body.errors).toHaveLength(1);
            expect(resRefresh.body.errors[0].extensions.exception.status).toStrictEqual(401);
        });
    });

    describe('[Logout] ...', () => {
        it('should logout user', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload
            }));

            const resLogin = await request(app.getHttpServer())
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

            const resLogout = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${resLogin.body.data.auth.login.accessToken}`)
                .set('Cookie', `jwt-token=${resLogin.body.data.auth.login.refreshToken}`)
                .send({
                    operationName: 'Logout',
                    query: `
                        mutation Logout {
                            auth {
                                logout
                            }
                        }
                    `
                });

            const resRefresh = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', `jwt-token=${resLogin.body.data.auth.login.refreshToken}`)
                .send({
                    query: `
                        mutation {
                            auth {
                                refresh {
                                    accessToken
                                    refreshToken
                                }
                            }
                        }
                    `
                });

            expect(Array.isArray(resRefresh.body.errors)).toBeTruthy();
            expect(resRefresh.body.errors).toHaveLength(1);
            expect(resRefresh.body.errors[0].extensions.exception.status).toStrictEqual(401);
        });

        it('should return 401 status when try to logging out the unauthorized user', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const users = getRepository(User);
            const user = await users.save(users.create({ 
                name: Faker.internet.userName(), 
                ...payload
            }));

            const resLogout = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
                        mutation {
                            auth {
                                logout
                            }
                        }
                    `
                });

            expect(Array.isArray(resLogout.body.errors)).toBeTruthy();
            expect(resLogout.body.errors).toHaveLength(1);
            expect(resLogout.body.errors[0].extensions.exception.status).toStrictEqual(401);
        });
    });
});
