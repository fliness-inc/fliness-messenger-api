import { Test } from '@nestjs/testing';
import facker from 'faker';
import { AuthService } from '@schema/models/auth/auth.service';
import { Tokens, TokensService } from '@schema/models/tokens/tokens.service';
import { AuthMutationResolver } from '@schema/models/auth/auth.mutation.resolver';
import * as uuid from 'uuid';
import { AuthSignInDTO, AuthSignUpDTO } from '@schema/models/auth/auth.dto';
import { Context } from '@schema/utils';
import { User as UserEntity } from '@db/entities/user.entity';
import { Auth as AuthModel } from '@schema/models/auth/auth.model';

describe('[Auth Module] ...', () => {
  let authService: AuthService;
  let tokensService: TokensService;
  let authMutationResolver: AuthMutationResolver;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthMutationResolver, AuthService, TokensService]
    })
      .overrideProvider(AuthService)
      .useFactory({
        factory: () => ({
          signIn: () => {},
          signUp: () => {}
        })
      })
      .overrideProvider(TokensService)
      .useFactory({
        factory: () => ({
          maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
          create: () => {},
          delete: () => {},
          refresh: () => {}
        })
      })
      .compile();

    authService = moduleRef.get<AuthService>(AuthService);
    tokensService = moduleRef.get<TokensService>(TokensService);
    authMutationResolver = moduleRef.get<AuthMutationResolver>(
      AuthMutationResolver
    );
  });

  describe('[Auth Mutation Resolver] ...', () => {
    it('should return static id', () => {
      const staticId: string = authMutationResolver.staticId();

      expect(uuid.validate(staticId)).toBeTruthy();
      expect(uuid.version(staticId)).toEqual(4);
    });

    it('should return auth object', async () => {
      const auth: AuthModel = await authMutationResolver.auth();

      expect(typeof auth).toEqual('object');
    });

    describe('[Sign ... ] ...', () => {
      let ctx: Context;

      beforeEach(() => {
        ctx = {
          req: <any>{
            headers: {
              'user-agent': facker.internet.userAgent()
            },
            cookies: {
              'jwt-token': facker.random.uuid()
            }
          },
          res: <any>{
            cookie: jest.fn(() => {})
          },
          dataloaders: new WeakMap()
        };
      });

      it('should sign in a user', async () => {
        const user = new UserEntity();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const tokens: Tokens = {
          accessToken: facker.random.word(),
          refreshToken: facker.random.uuid()
        };

        const payload: AuthSignInDTO = {
          email: user.name,
          password: user.password
        };

        const authSignInFunc = jest.spyOn(authService, 'signIn');
        authSignInFunc.mockResolvedValueOnce(user);

        const tokensCreateFunc = jest.spyOn(tokensService, 'create');
        tokensCreateFunc.mockResolvedValueOnce(tokens);

        expect(await authMutationResolver.signIn(payload, ctx)).toStrictEqual(
          tokens
        );

        expect(authSignInFunc).toBeCalledTimes(1);
        expect(authSignInFunc).toBeCalledWith(payload.email, payload.password);

        expect(tokensCreateFunc).toBeCalledTimes(1);
        expect(tokensCreateFunc).toBeCalledWith(
          user.id,
          ctx.req.headers['user-agent']
        );

        expect(ctx.res.cookie).toBeCalledTimes(1);
        expect(ctx.res.cookie).toBeCalledWith(
          'jwt-token',
          tokens.refreshToken,
          {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 60 // 60 days
          }
        );
      });

      it('should sign up a user', async () => {
        const user = new UserEntity();
        user.name = facker.internet.userName();
        user.email = facker.internet.email();
        user.password = facker.internet.password();

        const tokens: Tokens = {
          accessToken: facker.random.word(),
          refreshToken: facker.random.uuid()
        };

        const payload: AuthSignUpDTO = {
          name: user.name,
          email: user.email,
          password: user.password
        };

        const authSignUpFunc = jest.spyOn(authService, 'signUp');
        authSignUpFunc.mockResolvedValueOnce(user);

        const tokensCreateFunc = jest.spyOn(tokensService, 'create');
        tokensCreateFunc.mockResolvedValueOnce(tokens);

        expect(await authMutationResolver.signUp(payload, ctx)).toEqual(tokens);

        expect(authSignUpFunc).toBeCalledTimes(1);
        expect(authSignUpFunc).toBeCalledWith(
          payload.name,
          payload.email,
          payload.password
        );

        expect(tokensCreateFunc).toBeCalledTimes(1);
        expect(tokensCreateFunc).toBeCalledWith(
          user.id,
          ctx.req.headers['user-agent']
        );

        expect(ctx.res.cookie).toBeCalledTimes(1);
        expect(ctx.res.cookie).toBeCalledWith(
          'jwt-token',
          tokens.refreshToken,
          {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 60 // 60 days
          }
        );
      });

      it('should sign out a user', async () => {
        const tokensCreateFunc = jest.spyOn(tokensService, 'delete');
        tokensCreateFunc.mockResolvedValueOnce(undefined);

        expect(await authMutationResolver.signOut(ctx)).toEqual(true);

        expect(tokensCreateFunc).toBeCalledTimes(1);
        expect(tokensCreateFunc).toBeCalledWith(
          ctx.req.cookies['jwt-token'],
          ctx.req.headers['user-agent']
        );

        expect(ctx.res.cookie).toBeCalledTimes(1);
        expect(ctx.res.cookie).toBeCalledWith('jwt-token', '', {
          httpOnly: true,
          maxAge: 0
        });
      });

      it('should refreash tokens', async () => {
        const tokens: Tokens = {
          accessToken: facker.random.word(),
          refreshToken: facker.random.uuid()
        };

        const tokensCreateFunc = jest.spyOn(tokensService, 'refresh');
        tokensCreateFunc.mockResolvedValueOnce(tokens);

        expect(await authMutationResolver.refresh(ctx)).toEqual(tokens);

        expect(tokensCreateFunc).toBeCalledTimes(1);
        expect(tokensCreateFunc).toBeCalledWith(
          ctx.req.cookies['jwt-token'],
          ctx.req.headers['user-agent']
        );

        expect(ctx.res.cookie).toBeCalledTimes(1);
        expect(ctx.res.cookie).toBeCalledWith(
          'jwt-token',
          tokens.refreshToken,
          {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 60 // 60 days
          }
        );
      });
    });
  });
});
