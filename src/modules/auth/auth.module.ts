import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokensModule } from '@modules/tokens/tokens.module';
import UsersModule from '@modules/users/users.module';

@Module({
  imports: [
    TokensModule,
    UsersModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [JwtStrategy, AuthService],
})
export class AuthModule {}

export default AuthModule;
