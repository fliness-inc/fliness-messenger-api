/* import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UsersModule } from '@modules/users/users.module';
import { InvitationsController } from './invitations.controller';
import { FriendsModule } from '@modules/friends/friends.module';

@Module({
    imports: [UsersModule, FriendsModule],
    controllers: [InvitationsController],
    providers: [InvitationsService],
    exports: [InvitationsService]
})
export class InvitationsModule {}

export default InvitationsModule; */