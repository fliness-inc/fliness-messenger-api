import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import FriendsModule from '@modules/friends/friends.module';
import AuthModule from '@modules/auth/auth.module';
import UsersModule from '@modules/users/users.module';
import InvitationsModule from '@modules/invitations/invitations.module';
import ChatModule from '@modules/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(), 
    UsersModule,
    AuthModule, 
    FriendsModule,
    InvitationsModule,
    ChatModule
  ]
})
export class AppModule {}

export default AppModule;
