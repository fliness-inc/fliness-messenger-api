import { Resolver, Query, Mutation, ResolveField } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import MeMutation from '@/src/schema/models/me.mutation';
import UsersService from '@schema/resolvers/users/users.service';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import CurrentUser from '@schema/resolvers/auth/current-user';
import InvitationsMutation from '@schema/models/invitations.mutation';
import ChatsMutation from '@schema/models/chats.mutation';

@Resolver(of => MeMutation)
export class MeMutationResolver {

    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard)
    @Mutation(returns => MeMutation, { name: 'me' })
    public async me(): Promise<MeMutation> {
        return <MeMutation>{};
    }

    @ResolveField(type => InvitationsMutation, { name: 'invitations' })
    public async invitations(): Promise<InvitationsMutation> {
        return <InvitationsMutation>{};
    }

    @ResolveField(type => ChatsMutation, { name: 'chats' })
    public async chats(): Promise<ChatsMutation> {
        return <ChatsMutation>{};
    }

}

export default MeMutationResolver;