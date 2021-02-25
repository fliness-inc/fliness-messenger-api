import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO, SignUpDTO } from './auth.dto';
import { Tokens, TokensService } from '../tokens/tokens.service';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';

@Controller('/auth')
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService
  ) {}

  @Post('sign-in')
  public async signIn(
    @Body() payload: SignInDTO,
    @Req() req: Request
  ): Promise<Tokens> {
    const { email, password } = payload;
    const userAgent = req.headers['user-agent'];

    const user = await this.authService.signIn(email, password);

    const tokens = await this.tokensService.create(user.id, userAgent);

    req.res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge,
    });

    return tokens;
  }

  @Post('sign-up')
  public async signUp(
    @Body() payload: SignUpDTO,
    @Req() req: Request
  ): Promise<Tokens> {
    const { name, email, password } = payload;
    const userAgent = req.headers['user-agent'];

    const user = await this.authService.signUp(name, email, password);
    const tokens = await this.tokensService.create(user.id, userAgent);

    req.res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge,
    });

    return tokens;
  }

  @Post('refresh-tokens')
  public async refreshTokens(@Req() req: Request): Promise<Tokens> {
    const refreshToken = req.cookies['jwt-token'];
    const userAgent = req.headers['user-agent'];

    const tokens = await this.tokensService.refresh(refreshToken, userAgent);

    req.res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge,
    });

    return tokens;
  }

  @AuthGuard()
  @Post('sign-out')
  public async signOut(@Req() req: Request): Promise<void> {
    const refreshToken = req.cookies['jwt-token'];
    const userAgent = req.headers['user-agent'];

    await this.tokensService.delete(refreshToken, userAgent);

    req.res.cookie('jwt-token', '', {
      httpOnly: true,
      maxAge: 0,
    });
  }
}

export default AuthController;
