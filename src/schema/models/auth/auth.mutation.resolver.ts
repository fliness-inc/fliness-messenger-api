import {
  Resolver,
  Mutation,
  Args,
  Context,
  ResolveField
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import AuthService from './auth.service';
import TokensService from '@schema/models/tokens/tokens.service';
import { Context as AppContext } from '@schema/utils';
import { AuthSignInDTO, AuthSignUpDTO } from './auth.dto';
import Token from '@schema/models/tokens/tokens.model';
import AuthGuard from './auth.guard';
import Auth from './auth.model';
import UUID from '@schema/types/uuid.type';

@Resolver(() => Auth)
export class AuthResolver {
  public constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService
  ) {}

  @Mutation(() => Auth)
  public async auth(): Promise<Auth> {
    return <Auth>{};
  }

  @ResolveField(() => UUID, { name: 'id' })
  public staticId(): string {
    return '9b31c940-a925-49dc-bba3-b59890849529';
  }

  @ResolveField(() => Token)
  public async signIn(
    @Args('payload') payload: AuthSignInDTO,
    @Context() ctx: AppContext
  ): Promise<Token> {
    const { email, password } = payload;
    const userAgent = ctx.req.headers['user-agent'];

    const user = await this.authService.signIn(email, password);
    const tokens = await this.tokensService.create(user.id, userAgent);

    ctx.res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge
    });

    return tokens;
  }

  @ResolveField(() => Token)
  public async signUp(
    @Args('payload') payload: AuthSignUpDTO,
    @Context() ctx: AppContext
  ): Promise<Token> {
    const { name, email, password } = payload;
    const userAgent = ctx.req.headers['user-agent'];

    const user = await this.authService.signUp(name, email, password);
    const tokens = await this.tokensService.create(user.id, userAgent);

    ctx.res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge
    });

    return tokens;
  }

  @ResolveField(() => Token)
  public async refresh(@Context() ctx: AppContext): Promise<Token> {
    const refreshToken = ctx.req.cookies['jwt-token'];
    const userAgent = ctx.req.headers['user-agent'];

    const tokens = await this.tokensService.refresh(refreshToken, userAgent);

    ctx.res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge
    });

    return tokens;
  }

  @UseGuards(AuthGuard)
  @ResolveField(() => Boolean)
  public async signOut(@Context() ctx: AppContext): Promise<boolean> {
    const refreshToken = ctx.req.cookies['jwt-token'];
    const userAgent = ctx.req.headers['user-agent'];

    await this.tokensService.delete(refreshToken, userAgent);

    ctx.res.cookie('jwt-token', '', {
      httpOnly: true,
      maxAge: 0
    });

    return true;
  }
}

export default AuthResolver;
