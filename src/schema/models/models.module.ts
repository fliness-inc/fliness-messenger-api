import { Module } from '@nestjs/common';
import AuthModule from './auth/auth.module';
import ChatsModule from './chats/chats.module';
import FriendsModule from './friends/friends.module';
import InvitationsModule from './invitations/invitations.module';
import MeModule from './me/me.module';
import MembersModule from './members/members.module';
import MessagesModule from './messages/messages.module';
import TokensModule from './tokens/tokens.module';
import UsersModule from './users/users.module';

@Module({
  imports: [
    AuthModule,
    ChatsModule,
    FriendsModule,
    InvitationsModule,
    MeModule,
    MembersModule,
    MessagesModule,
    TokensModule,
    UsersModule
  ]
})
export class ModelsModule {}

export default ModelsModule;
