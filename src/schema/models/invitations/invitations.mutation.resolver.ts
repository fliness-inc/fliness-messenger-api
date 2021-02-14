import { Resolver, ResolveField, Args } from '@nestjs/graphql';
import User from '@schema/models/users/users.model';
import Invitation from '@schema/models/invitations/invitation.model';
import {
  Type,
  Status,
  CreateInvitationDTO
} from '@schema/models/invitations/invitations.dto';
import { InvitationsService } from '@schema/models/invitations/invitations.service';
import InvitationsMutation from '@schema/models/invitations/invitations.mutation';
import CurrentUser from '@schema/models/auth/current-user';
import UUID from '@schema/types/uuid.type';

@Resolver(() => InvitationsMutation)
export class InvitationsMutationResolver {
  public constructor(private readonly invitationsService: InvitationsService) {}

  @ResolveField(() => UUID, { name: 'id' })
  public staticId(): string {
    return '90bda5f6-ee53-4748-99c8-f001c5d6b82c';
  }

  @ResolveField(() => Invitation)
  public async create(
    @CurrentUser() user: User,
    @Args('payload') payload: CreateInvitationDTO
  ): Promise<Invitation> {
    const invitation = await this.invitationsService.create(
      user.id,
      payload.userId,
      payload.type
    );
    return {
      id: invitation.id,
      senderId: invitation.senderId,
      recipientId: invitation.recipientId,
      type: <Type>invitation.type.name,
      status: <Status>invitation.status.name,
      expiresAt: invitation.expiresAt
    };
  }

  @ResolveField(() => Invitation)
  public async accept(
    @Args('invitationId', { type: () => UUID }) invitationId: string
  ): Promise<Invitation> {
    const invitation = await this.invitationsService.accept(invitationId);
    return {
      id: invitation.id,
      senderId: invitation.senderId,
      recipientId: invitation.recipientId,
      type: <Type>invitation.type.name,
      status: <Status>invitation.status.name,
      expiresAt: invitation.expiresAt
    };
  }

  @ResolveField(() => Invitation)
  public async reject(
    @Args('invitationId', { type: () => UUID }) invitationId: string
  ): Promise<Invitation> {
    const invitation = await this.invitationsService.reject(invitationId);
    return {
      id: invitation.id,
      senderId: invitation.senderId,
      recipientId: invitation.recipientId,
      type: <Type>invitation.type.name,
      status: <Status>invitation.status.name,
      expiresAt: invitation.expiresAt
    };
  }
}

export default InvitationsMutationResolver;
