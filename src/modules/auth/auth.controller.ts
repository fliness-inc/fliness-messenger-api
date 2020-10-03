import { Body, Controller, Post, Res, Req, Get, UnauthorizedException} from '@nestjs/common';
import { ApiTags, ApiProperty, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TokensService } from '@modules/tokens/tokens.service';
import { AuthLoginDTO, AuthRegisterDTO } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    public constructor(
        private readonly authService: AuthService,
        private readonly tokensService: TokensService
    ) {}

    @ApiBody({ type: () => AuthLoginDTO })
    @Post('/login')
    public async login(
        @Req() req: Request,
        @Res() res: Response,
        @Body() payload: AuthLoginDTO,
    ): Promise<void> {
        const { email, password } = payload;
        const userAgent = req.headers['user-agent'];

        const user = await this.authService.login(email, password);
        const tokens = await this.tokensService.create(user.id, userAgent);

        res.cookie('jwt-token', tokens.refreshToken, {
            httpOnly: true,
            maxAge: this.tokensService.maxAge
        });

        res.status(200).json(tokens);
    }

    @ApiBody({ type: () => AuthRegisterDTO })
    @Post('/register')
    public async register(
        @Req() req: Request,
        @Res() res: Response,
        @Body() payload: AuthRegisterDTO
    ): Promise<void> {
        const { name, email, password } = payload;
        const userAgent = req.headers['user-agent'];

        const user = await this.authService.register(name, email, password);
        const tokens = await this.tokensService.create(user.id, userAgent);

        res.cookie('jwt-token', tokens.refreshToken, {
            httpOnly: true,
            maxAge: this.tokensService.maxAge
        });

        res.status(201).json(tokens);
    }

    @Get('/refresh')
    public async refresh(
        @Req() req: Request,
        @Res() res: Response
    ): Promise<void> {
        const refreshToken = req.cookies['jwt-token'];
        const userAgent = req.headers['user-agent'];

        const tokens = await this.tokensService.refresh(refreshToken, userAgent);

        res.cookie('jwt-token', tokens.refreshToken, {
            httpOnly: true,
            maxAge: this.tokensService.maxAge
        });

        res.status(200).json(tokens);
    }

    @Get('/logout')
    public async logout(
        @Req() req: Request,
        @Res() res: Response
    ): Promise<void> {
        const refreshToken = req.cookies['jwt-token'];
        const userAgent = req.headers['user-agent'];

        await this.tokensService.delete(refreshToken, userAgent);

        res.cookie('jwt-token', '', {
            httpOnly: true,
            maxAge: 0
        });

        res.status(200).json({});
    }
}

export default AuthController;
