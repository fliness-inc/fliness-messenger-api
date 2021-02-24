import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TokensModule } from './tokens/tokens.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, TokensModule, UsersModule],
})
export class ModulesModule {}

export default ModulesModule;
