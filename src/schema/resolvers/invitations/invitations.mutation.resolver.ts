import { UseGuards } from '@nestjs/common';
import { Resolver, Field, Parent, Query, ResolveField, ObjectType, Mutation, Args } from '@nestjs/graphql';
import User from '@schema/models/users.model';
import Invitation from '@schema/models/invitation';
import { Type, Status, CreateInvitationDTO } from '@schema/resolvers/invitations/invitations.dto';
import { InvitationsService } from '@schema/resolvers/invitations/invitations.service';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import InvitationsMutation from '@schema/models/invitations.mutation';
import CurrentUser from '@schema/resolvers/auth/current-user';
import UUID from '@schema/types/uuid';

@UseGuards(AuthGuard)
@Resolver(of => InvitationsMutation)
export class InvitationsMutationResolver {

    public constructor(private readonly invitationsService: InvitationsService) {}

    @ResolveField(returns => Invitation)
    public async create(
        @CurrentUser() user: User,
        @Args('payload') payload: CreateInvitationDTO,
    ): Promise<Invitation> {
        const invitation = await this.invitationsService.create(user.id, payload.userId, payload.type);
        return {
            id: invitation.id,
            senderId: invitation.senderId,
            recipientId: invitation.recipientId,
            type: <Type>invitation.type.name,
            status: <Status>invitation.status.name,
            expiresAt: invitation.expiresAt
        };
    }

    @ResolveField(returns => Invitation)
    public async accept(
        @CurrentUser() user: User,
        @Args('invitationId', { type: () => UUID }) invitationId: string,
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

    @ResolveField(returns => Invitation)
    public async reject(
        @CurrentUser() user: User,
        @Args('invitationId', { type: () => UUID }) invitationId: string,
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