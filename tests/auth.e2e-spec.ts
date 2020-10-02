import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { config as setupDotEnv } from 'dotenv';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import { getRepository } from 'typeorm';
import { User } from '@database/entities/user';
import { AppModule } from '@modules/app/app.module';
import request from 'supertest';
import * as uuid from 'uuid';
import Faker from 'faker';

setupDotEnv();

jest.setTimeout(50000);

describe('[E2E] [AuthController] ...', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();
        await getRepository(User).query('TRUNCATE users CASCADE');
        await getRepository(User).query('TRUNCATE tokens CASCADE');
    });

    afterEach(async () => {
        await getRepository(User).query('TRUNCATE users CASCADE');
        await getRepository(User).query('TRUNCATE tokens CASCADE');
    });

    afterAll(async () => {
        await app.close();
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
                .post('/auth/login')
                .send(payload);
    
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
    
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.refreshToken).toStrictEqual(jwtToken);
        });
    
        it('should return 401 status when trying to get profile information without access token', async () => {
            const res = await request(app.getHttpServer())
                .get('/me')
                .send();
    
            expect(res.status).toStrictEqual(401);
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
                .get('/me')
                .set('Authorization', `Bearer ${app.get(JwtService).sign({ id: user.id }, { expiresIn: 0 })}`)
                .send();
    
            expect(res.status).toStrictEqual(401);
        });
    
        it('should return 401 status when the user was not found', async () => {
            const payload = { 
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send(payload);
    
            expect(res.status).toStrictEqual(401);
        });
    
        it('should return 401 status when the user was not found', async () => {
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
                .post('/auth/login')
                .send(payload);
    
            expect(res.status).toStrictEqual(401);
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
                .post('/auth/login')
                .send(payload);
                
            const tokens = resLogin.body;
    
            const resMe = await request(app.getHttpServer())
                .get('/me')
                .set('Authorization', `Bearer ${tokens.accessToken}`)
                .send();
    
            expect(resMe.body).toHaveProperty('id', user.id);
        });
    });

    describe('[Registration] ...', () => {
        it('should provide access to profile information after successful registration', async () => {
            const payload = { 
                name: Faker.internet.userName(),
                email: Faker.internet.email(),
                password: Faker.random.word()
            };
    
            const res = await request(app.getHttpServer())
                .post('/auth/register')
                .send(payload);
                
            const tokens = res.body;
    
            const resMe = await request(app.getHttpServer())
                .get('/me')
                .set('Authorization', `Bearer ${tokens.accessToken}`)
                .send();
    
            expect(resMe.body).toHaveProperty('name', payload.name);
            expect(resMe.body).toHaveProperty('email', payload.email);
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
                .post('/auth/login')
                .send(payload);
                
            const tokens = resLogin.body;
    
            const resRefresh= await request(app.getHttpServer())
                .get('/auth/refresh')
                .set('Cookie', `jwt-token=${tokens.refreshToken}`)
                .send();

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
    
            expect(resRefresh.body).toHaveProperty('accessToken');
            expect(resRefresh.body).toHaveProperty('refreshToken');
            expect(resRefresh.body.refreshToken).toStrictEqual(jwtToken);

            const resMe = await request(app.getHttpServer())
                .get('/me')
                .set('Authorization', `Bearer ${resRefresh.body.accessToken}`)
                .send();
    
            expect(resMe.body).toHaveProperty('id', user.id);
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
                .post('/auth/login')
                .send(payload);

            const firstTokens = resFirstLogin.body;

            const resSecondLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send(payload);
                
            const secondTokens = resFirstLogin.body;
    
            const resRefresh= await request(app.getHttpServer())
                .get('/auth/refresh')
                .set('Cookie', `jwt-token=${firstTokens.refreshToken}`)
                .send();

            expect(resRefresh.status).toStrictEqual(401);
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
                .post('/auth/login')
                .send(payload);

            const resLogout = await request(app.getHttpServer())
                .get('/auth/logout')
                .set('Cookie', `jwt-token=${resLogin.body.refreshToken}`)
                .send(payload);

            expect(resLogout.status).toEqual(200);

            const resRefresh= await request(app.getHttpServer())
                .get('/auth/refresh')
                .set('Cookie', `jwt-token=${resLogin.body.refreshToken}`)
                .send();

            expect(resRefresh.status).toEqual(401);
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
                .get('/auth/logout')
                .send(payload);

            expect(resLogout.status).toEqual(401);
        });
    });
});
