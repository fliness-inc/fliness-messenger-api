import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { InvitationsModule } from '@modules/invitations/invitations.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [InvitationsModule, UsersModule],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService]
})
export class FriendsModule {}

export default FriendsModule;