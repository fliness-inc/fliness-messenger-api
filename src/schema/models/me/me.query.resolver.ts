import { Resolver, Query, ResolveField } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import MeQuery from '@schema/models/me/me.query';
import UsersService from '@schema/models/users/users.service';
import AuthGuard from '@schema/models/auth/auth.guard';
import CurrentUser from '@schema/models/auth/current-user';
import InvitationsQuery from '@schema/models/invitations/invitations.query';

@UseGuards(AuthGuard)
@Resolver(() => MeQuery)
export class MeQueryResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => MeQuery, { name: 'me' })
  public async getProfile(@CurrentUser() user: any): Promise<MeQuery> {
    return await this.usersService.findOne({ where: { id: user.id } });
  }

  @ResolveField(() => InvitationsQuery)
  public async invitations(): Promise<InvitationsQuery> {
    return <InvitationsQuery>{};
  }
}

export default MeQueryResolver;
