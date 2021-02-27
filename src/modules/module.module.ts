import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatsModule } from './chats/chats.module';
import { TokensModule } from './tokens/tokens.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/message.module';

@Module({
  imports: [AuthModule, TokensModule, UsersModule, ChatsModule, MessagesModule],
})
export class ModulesModule {}

export default ModulesModule;
