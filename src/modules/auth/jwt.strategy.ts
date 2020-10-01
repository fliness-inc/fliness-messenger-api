import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { config as setupDotEnv } from 'dotenv';

setupDotEnv();

const {
    JWT_SECRET_KEY
} = process.env;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    public constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: JWT_SECRET_KEY,
        });
    }

    public async validate(payload: any): Promise<any> {
        return { id: payload.id };
    }
}
