import { Module } from '@nestjs/common';
import InvitationsService from '@schema/resolvers/invitations/invitations.service';
import UsersModule from '@schema/resolvers/users/users.module';
import InvitationsQueryResolver from '@schema/resolvers/invitations/invitations.query.resolver';
import InvitationsMutationResolver from '@schema/resolvers/invitations/invitations.mutation.resolver';
import FriendsModule from '@schema/resolvers/friends/friends.module';
import InvitationResolver from '@schema/resolvers/invitations/invitation.resolver';

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