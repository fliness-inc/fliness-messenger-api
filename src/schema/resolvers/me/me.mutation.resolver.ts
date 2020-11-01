import { Resolver, Mutation, ResolveField } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import MeMutation from '@/src/schema/models/me.mutation';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import InvitationsMutation from '@schema/models/invitations.mutation';
import ChatsMutation from '@schema/models/chats.mutation';

@Resolver(() => MeMutation)
export class MeMutationResolver {

    @UseGuards(AuthGuard)
    @Mutation(() => MeMutation, { name: 'me' })
	public async me(): Promise<MeMutation> {
		return <MeMutation>{};
	}

    @ResolveField(() => InvitationsMutation, { name: 'invitations' })
    public async invitations(): Promise<InvitationsMutation> {
    	return <InvitationsMutation>{};
    }

    @ResolveField(() => ChatsMutation, { name: 'chats' })
    public async chats(): Promise<ChatsMutation> {
    	return <ChatsMutation>{};
    }

}

export default MeMutationResolver;