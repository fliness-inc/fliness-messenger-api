import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField } from '@nestjs/graphql';
import User from '@schema/models/users/users.model';
import Invitation from '@schema/models/invitations/invitation.model';
import { Type, Status } from '@schema/models/invitations/invitations.dto';
import { InvitationsService } from '@schema/models/invitations/invitations.service';
import AuthGuard from '@schema/models/auth/auth.guard';
import InvitationsQuery from '@schema/models/invitations/invitations.query';
import CurrentUser from '@schema/models/auth/current-user';

@UseGuards(AuthGuard)
@Resolver(() => InvitationsQuery)
export class InvitationsQueryResolver {
  public constructor(private readonly invitationsService: InvitationsService) {}

  @ResolveField('fromMe', () => [Invitation])
  public async getInvitationsFromMe(
    @CurrentUser() user: User
  ): Promise<Invitation[]> {
    const invitations = await this.invitationsService.find({
      senderId: user.id
    });
    return invitations.map<Invitation>(i => ({
      id: i.id,
      senderId: i.senderId,
      recipientId: i.recipientId,
      type: <Type>i.type.name,
      status: <Status>i.status.name,
      expiresAt: i.expiresAt
    }));
  }

  @ResolveField('forMe', () => [Invitation])
  public async getInvitationsToMe(
    @CurrentUser() user: User
  ): Promise<Invitation[]> {
    const invitations = await this.invitationsService.find({
      recipientId: user.id
    });
    return invitations.map<Invitation>(i => ({
      id: i.id,
      senderId: i.senderId,
      recipientId: i.recipientId,
      type: <Type>i.type.name,
      status: <Status>i.status.name,
      expiresAt: i.expiresAt
    }));
  }
}

export default InvitationsQueryResolver;
