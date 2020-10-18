import { UseGuards } from '@nestjs/common';
import { Resolver, Field, Parent, Query, ResolveField, ObjectType, Mutation, Context, Info } from '@nestjs/graphql';
import User from '@schema/models/user';
import Invitation from '@schema/models/invitation';
import { Type, Status } from '@schema/resolvers/invitations/invitations.dto';
import { InvitationsService } from '@schema/resolvers/invitations/invitations.service';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import InvitationsQuery from '@schema/models/invitations.query';
import CurrentUser from '@schema/resolvers/auth/current-user';
import UsersService from '@schema/resolvers/users/users.service';

@UseGuards(AuthGuard)
@Resolver(of => InvitationsQuery)
export class InvitationsQueryResolver {

    public constructor(
        private readonly invitationsService: InvitationsService,
        private readonly usersService: UsersService
    ) {}

    @ResolveField('fromMe', returns => [Invitation])
    public async getInvitationsFromMe(@CurrentUser() user: User): Promise<Invitation[]> {
        const invitations = await this.invitationsService.find({ senderId: user.id });
        return invitations.map<Invitation>(i => ({
            id: i.id,
            senderId: i.senderId,
            recipientId: i.recipientId,
            type: <Type>i.type.name,
            status: <Status>i.status.name,
            expiresAt: i.expiresAt
        }));
    }

    @ResolveField('forMe', returns => [Invitation])
    public async getInvitationsToMe(@CurrentUser() user: User): Promise<Invitation[]> {
        const invitations = await this.invitationsService.find({ recipientId: user.id })
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