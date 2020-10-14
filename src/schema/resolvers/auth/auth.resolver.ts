import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import AuthService from '@schema/resolvers/auth/auth.service';
import TokensService from '@schema/resolvers/tokens/tokens.service';
import { Context as AppContext } from '@schema/utils';
import { AuthLoginDTO, AuthRegisterDTO } from '@schema/resolvers/auth/auth.dto';
import Token from '@schema/models/token';
import AuthGuard from '@schema/resolvers/auth/auth.guard';

@Resolver()
export class AuthResolver {
    public constructor(
        private readonly authService: AuthService,
        private readonly tokensService: TokensService
    ) {}

    @Mutation(returns => Token)
    public async login(
        @Args('payload') payload: AuthLoginDTO,
        @Context() ctx: AppContext
    ): Promise<Token> {
        const { email, password } = payload;
        const userAgent = ctx.req.headers['user-agent'];

        const user = await this.authService.login(email, password);
        const tokens = await this.tokensService.create(user.id, userAgent);

        ctx.res.cookie('jwt-token', tokens.refreshToken, {
            httpOnly: true,
            maxAge: this.tokensService.maxAge
        });

        return tokens;
    }

    @Mutation(returns => Token)
    public async register(
        @Args('payload') payload: AuthRegisterDTO,
        @Context() ctx: AppContext
    ): Promise<Token> {
        const { name, email, password } = payload;
        const userAgent = ctx.req.headers['user-agent'];

        const user = await this.authService.register(name, email, password);
        const tokens = await this.tokensService.create(user.id, userAgent);

        ctx.res.cookie('jwt-token', tokens.refreshToken, {
            httpOnly: true,
            maxAge: this.tokensService.maxAge
        });

        return tokens;
    }

    @Mutation(returns => Token)
    public async refresh(
        @Context() ctx: AppContext
    ): Promise<Token> {
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
    @Mutation(returns => Boolean)
    public async logout(
        @Context() ctx: AppContext
    ): Promise<Boolean> {
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