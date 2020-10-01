import { Body, Controller, Post, Res, Req, Get, UnauthorizedException} from '@nestjs/common';
import { ApiTags, ApiProperty, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TokensService } from '@modules/tokens/tokens.service';

export class UserLoginDTO {
    @ApiProperty({ type: () => String })
    public email: string;

    @ApiProperty({ type: () => String })
    public password: string;
}

export class UserRegisterDTO {
    @ApiProperty({ type: () => String })
    public name: string;

    @ApiProperty({ type: () => String })
    public email: string;

    @ApiProperty({ type: () => String })
    public password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    public constructor(
        private readonly authService: AuthService,
        private readonly tokensService: TokensService
    ) {}

    @ApiBody({ type: () => UserLoginDTO })
    @Post('/login')
    public async login(
        @Req() req: Request,
        @Res() res: Response,
        @Body() payload: UserLoginDTO,
    ): Promise<void> {
        try {
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
        catch(e) {
            if (e instanceof UnauthorizedException)
                res.status(401).json({ message: e.message });
            else
                res.status(500).json({ message: e.message });
        }
    }

    @ApiBody({ type: () => UserLoginDTO })
    @Post('/register')
    public async register(
        @Req() req: Request,
        @Res() res: Response,
        @Body() payload: UserRegisterDTO
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
        try {
            const refreshToken = req.cookies['jwt-token'];
            const userAgent = req.headers['user-agent'];
    
            const tokens = await this.tokensService.refresh(refreshToken, userAgent);
    
            res.cookie('jwt-token', tokens.refreshToken, {
                httpOnly: true,
                maxAge: this.tokensService.maxAge
            });
    
            res.status(200).json(tokens);
        }
        catch(e) {
            if (e instanceof UnauthorizedException)
                res.status(401).json({ message: e.message });
            else 
                res.status(500).json({ message: e.messsage })
        }
        
    }

    @Get('/logout')
    public async logout(
        @Req() req: Request,
        @Res() res: Response
    ): Promise<void> {
        try {
            const refreshToken = req.cookies['jwt-token'];
            const userAgent = req.headers['user-agent'];
    
            await this.tokensService.delete(refreshToken, userAgent);
    
            res.cookie('jwt-token', '', {
                httpOnly: true,
                maxAge: 0
            });
    
            res.status(200).json({});
        }
        catch(e) {
            if (e instanceof UnauthorizedException)
                res.status(401).json({ message: e.message });
            else 
                res.status(500).json({ message: e.messsage })
        }
        
    }
}

export default AuthController;
