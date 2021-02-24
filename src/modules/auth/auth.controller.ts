import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO, SignUpDTO } from './auth.dto';
import { TokensService } from '../tokens/tokens.service';
import { Request, Response } from 'express';
import { makeDataFormatResponse } from '@tools/data.interceptor';
import { JwtAuthGuard } from './auth.guard';

@Controller('/auth')
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService
  ) {}

  @Post('sign-in')
  public async signIn(
    @Body() payload: SignInDTO,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { email, password } = payload;
    const userAgent = req.headers['user-agent'];

    const user = await this.authService.signIn(email, password);

    const tokens = await this.tokensService.create(user.id, userAgent);

    res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge,
    });

    makeDataFormatResponse(res, { data: tokens });
  }

  @Post('sign-up')
  public async signUp(
    @Body() payload: SignUpDTO,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { name, email, password } = payload;
    const userAgent = req.headers['user-agent'];

    const user = await this.authService.signUp(name, email, password);
    const tokens = await this.tokensService.create(user.id, userAgent);

    res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge,
    });

    makeDataFormatResponse(res, { data: tokens });
  }

  @Post('refresh-tokens')
  public async refresh(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const refreshToken = req.cookies['jwt-token'];
    const userAgent = req.headers['user-agent'];

    const tokens = await this.tokensService.refresh(refreshToken, userAgent);

    res.cookie('jwt-token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.tokensService.maxAge,
    });

    makeDataFormatResponse(res, { data: tokens });
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  public async signOut(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const refreshToken = req.cookies['jwt-token'];
    const userAgent = req.headers['user-agent'];

    await this.tokensService.delete(refreshToken, userAgent);

    res.cookie('jwt-token', '', {
      httpOnly: true,
      maxAge: 0,
    });

    makeDataFormatResponse(res);
  }
}

export default AuthController;
