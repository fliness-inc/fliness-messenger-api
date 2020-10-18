import { Resolver, Query, Mutation, ResolveField } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import MeQuery from '@schema/models/me.query';
import UsersService from '@schema/resolvers/users/users.service';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import CurrentUser from '@schema/resolvers/auth/current-user';
import InvitationsQuery from '@schema/models/invitations.query';

@UseGuards(AuthGuard)
@Resolver(of => MeQuery)
export class MeQueryResolver {

    constructor(private readonly usersService: UsersService) {}

    @Query(returns => MeQuery, { name: 'me' })
    public async getProfile(@CurrentUser() user: any): Promise<MeQuery> {
        return await this.usersService.findOne({ where: { id: user.id } });
    }

    @ResolveField(type => InvitationsQuery)
    public async invitations(): Promise<InvitationsQuery> {
        return <InvitationsQuery>{};
    }
}

export default MeQueryResolver;