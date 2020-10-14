import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import TokensService from '@schema/resolvers/tokens/tokens.service';

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