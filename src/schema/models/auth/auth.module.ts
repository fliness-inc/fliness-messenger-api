import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import JwtStrategy from './jwt.strategy';
import UsersModule from '@schema/models/users/users.module';
import TokensModule from '@schema/models/tokens/tokens.module';
import AuthService from './auth.service';
import AuthResolver from './auth.resolver';

@Module({
  imports: [TokensModule, UsersModule, PassportModule],
  providers: [JwtStrategy, AuthService, AuthResolver],
  exports: [JwtStrategy, AuthService]
})
export class AuthModule {}

export default AuthModule;
