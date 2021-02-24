import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Connection, getConnection } from 'typeorm';
import * as request from 'supertest';
import * as uuid from 'uuid';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as faker from 'faker';
import { AuthModule } from '../auth.module';
import { SignInDTO, SignUpDTO } from '../auth.dto';
import { UsersService } from '@modules/users/users.service';

dotenv.config();

jest.setTimeout(50000);

describe('[IT] [AuthModule] ...', () => {
  let app: INestApplication;
  let connection: Connection;

  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(), AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    usersService = app.get<UsersService>(UsersService);

    connection = getConnection();
    await connection.synchronize(true);
  });

  beforeEach(async () => {
    await connection.query('TRUNCATE users, tokens CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Login] ...', () => {
    it('should authorize the user and return the access and refresh tokens', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      await usersService.create({
        name: faker.internet.userName(),
        ...payload,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      expect(res.status).toEqual(200);

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

      expect(res.body).toStrictEqual({
        statusCode: 200,
        data: {
          accessToken: res.body.data.accessToken,
          refreshToken: jwtToken,
        },
      });
    });

    it('should return 401 status when trying to get profile information without access token', async () => {
      const { body, status } = await request(app.getHttpServer())
        .get('/me')
        .send();

      expect(status).toEqual(401);
      expect(body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The authentication fails',
      });
    });

    it('should return 401 status when trying to get profile information with expired access token', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      const user = await usersService.create({
        name: faker.internet.userName(),
        ...payload,
      });

      const { status, body } = await request(app.getHttpServer())
        .get('/me')
        .set({
          'user-agent': userAgent,
          Authorization: `Bearer ${app
            .get(JwtService)
            .sign({ id: user.id }, { expiresIn: 0 })}`,
        })
        .send(payload);

      expect(status).toEqual(401);
      expect(body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The authentication fails',
      });
    });

    it('should return 404 status when the user was not found', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      expect(status).toEqual(404);
      expect(body).toStrictEqual({
        statusCode: 404,
        error: 'Not Found',
        message: `The user was not found with the email: ${payload.email}`,
      });
    });

    it('should return 401 status when the user password was not found', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      await usersService.create({
        name: faker.internet.userName(),
        ...payload,
        password: 'another password',
      });

      const { status, body } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      expect(status).toEqual(401);
      expect(body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The authentication fails',
      });
    });

    it('should provide access to profile information after successful authorization', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      const user = await usersService.create({
        name: faker.internet.userName(),
        ...payload,
      });

      const {
        body: { data: tokens },
      } = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      const { body, status } = await request(app.getHttpServer())
        .get('/me')
        .set({
          'user-agent': userAgent,
          Authorization: `Bearer ${tokens.accessToken}`,
        })
        .send(payload);

      expect(status).toEqual(200);
      expect(body).toStrictEqual({
        statusCode: 200,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarURL: user.avatarURL,
          createdAt: user.createdAt.toJSON(),
        },
      });
    });
  });

  describe('[Registration] ...', () => {
    it('should provide access to profile information after successful registration', async () => {
      const userAgent = uuid.v4();
      const payload: SignUpDTO = {
        name: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      expect(signUpResponse.status).toEqual(200);

      const meResponse = await request(app.getHttpServer())
        .get('/me')
        .set({
          'user-agent': userAgent,
          Authorization: `Bearer ${signUpResponse.body.data.accessToken}`,
        })
        .send(payload);

      expect(meResponse.status).toEqual(200);
      expect(meResponse.body).toStrictEqual({
        statusCode: 200,
        data: {
          id: meResponse.body.data.id,
          email: payload.email,
          name: payload.name,
          avatarURL: meResponse.body.data.avatarURL,
          createdAt: meResponse.body.data.createdAt,
        },
      });
    });
  });

  describe('[Refresh Tokens] ...', () => {
    it('should refresh the tokens', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      await usersService.create({
        name: faker.internet.userName(),
        ...payload,
      });

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      const tokens = signInResponse.body.data;

      const resreshResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
          Cookie: `jwt-token=${tokens.refreshToken}`,
        })
        .send(payload);

      expect(resreshResponse.status).toEqual(200);
      expect(resreshResponse.headers).toHaveProperty('set-cookie');
      expect(resreshResponse.headers['set-cookie']).toHaveLength(1);

      const cookieParams = (<string>(
        resreshResponse.headers['set-cookie'][0]
      )).split('; ');
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

      expect(resreshResponse.body).toStrictEqual({
        statusCode: 200,
        data: {
          accessToken: resreshResponse.body.data.accessToken,
          refreshToken: jwtToken,
        },
      });

      const meResponse = await request(app.getHttpServer())
        .get('/me')
        .set({
          'user-agent': userAgent,
          Authorization: `Bearer ${resreshResponse.body.data.accessToken}`,
        })
        .send(payload);

      expect(meResponse.status).toEqual(200);
      expect(meResponse.body).toStrictEqual({
        statusCode: 200,
        data: {
          id: meResponse.body.data.id,
          email: payload.email,
          name: meResponse.body.data.name,
          avatarURL: meResponse.body.data.avatarURL,
          createdAt: meResponse.body.data.createdAt,
        },
      });
    });

    it('should return 401 status when trying to refresh tokens with the expired refresh token', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      await usersService.create({
        name: faker.internet.userName(),
        ...payload,
      });

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      const firstTokens = signInResponse.body.data;

      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      const resreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh-tokens')
        .set({
          'user-agent': userAgent,
          Cookie: `jwt-token=${firstTokens.refreshToken}`,
        })
        .send(payload);

      expect(resreshResponse.status).toEqual(401);
      expect(resreshResponse.body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The refresh token is expired',
      });
    });
  });

  describe('[Logout] ...', () => {
    it('should logout user', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      await usersService.create({
        name: faker.internet.userName(),
        ...payload,
      });

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      const tokens = signInResponse.body.data;

      const signOutResponse = await request(app.getHttpServer())
        .post('/auth/sign-out')
        .set({
          'user-agent': userAgent,
          Cookie: `jwt-token=${tokens.refreshToken}`,
          Authorization: `Bearer ${tokens.accessToken}`,
        })
        .send(payload);

      expect(signOutResponse.status).toEqual(200);
      expect(signOutResponse.body).toStrictEqual({
        statusCode: 200,
      });

      const resreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh-tokens')
        .set({
          'user-agent': userAgent,
          Cookie: `jwt-token=${tokens.refreshToken}`,
        })
        .send(payload);

      expect(resreshResponse.status).toEqual(401);
      expect(resreshResponse.body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The refresh token is expired',
      });
    });

    it('should return 401 status when try to logging out the unauthorized user', async () => {
      const userAgent = uuid.v4();
      const payload: SignInDTO = {
        email: faker.internet.email(),
        password: faker.random.word(),
      };

      await usersService.create({
        name: faker.internet.userName(),
        ...payload,
      });

      const signOutResponse = await request(app.getHttpServer())
        .post('/auth/sign-out')
        .set({
          'user-agent': userAgent,
        })
        .send(payload);

      expect(signOutResponse.status).toEqual(401);
      expect(signOutResponse.body).toStrictEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'The authentication fails',
      });
    });
  });
});
