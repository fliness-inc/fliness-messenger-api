import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import JwtStrategy from '@schema/resolvers/auth/jwt.strategy';
import UsersModule from '@schema/resolvers/users/users.module';
import TokensModule from '@schema/resolvers/tokens/tokens.module'; 
import AuthService from '@schema/resolvers/auth/auth.service';
import AuthResolver from '@schema/resolvers/auth/auth.resolver';

@Module({
    imports: [
        TokensModule,
        UsersModule,
        PassportModule,
    ],
    providers: [JwtStrategy, AuthService, AuthResolver],
    exports: [JwtStrategy, AuthService],
})
export class AuthModule {}

export default AuthModule;
