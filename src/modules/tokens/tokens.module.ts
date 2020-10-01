import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtModule } from '@nestjs/jwt';

const { JWT_SECRET_KEY } = process.env;

@Module({
    imports: [
        JwtModule.register({
            secret: JWT_SECRET_KEY,
        })
    ],
    providers: [TokensService],
    exports: [TokensService]
})
export class TokensModule {}

export default TokensModule;