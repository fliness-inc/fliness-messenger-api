import { Resolver, Mutation, ResolveField } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import MeMutation from '@schema/models/me/me.mutation';
import AuthGuard from '@schema/models/auth/auth.guard';
import InvitationsMutation from '@schema/models/invitations/invitations.mutation';
import ChatsMutation from '@schema/models/chats/chats.mutation';
import UUID from '@schema/types/uuid.type';

@Resolver(() => MeMutation)
export class MeMutationResolver {
  @ResolveField(() => UUID, { name: 'id' })
  public staticId(): string {
    return 'ce7c0fd6-318c-4b05-b08a-a08d55c358e0';
  }

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
