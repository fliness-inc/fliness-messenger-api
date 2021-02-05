import { Module } from '@nestjs/common';
import InvitationsService from '@schema/models/invitations/invitations.service';
import UsersModule from '@schema/models/users/users.module';
import InvitationsQueryResolver from '@schema/models/invitations/invitations.query.resolver';
import InvitationsMutationResolver from '@schema/models/invitations/invitations.mutation.resolver';
import FriendsModule from '@schema/models/friends/friends.module';
import InvitationResolver from '@schema/models/invitations/invitation.resolver';

@Module({
  imports: [UsersModule, FriendsModule],
  providers: [
    InvitationResolver,
    InvitationsQueryResolver,
    InvitationsMutationResolver,
    InvitationsService
  ],
  exports: [InvitationsService]
})
export class InvitationsModule {}

export default InvitationsModule;
