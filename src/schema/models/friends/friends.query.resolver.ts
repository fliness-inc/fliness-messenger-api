import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import AuthGuard from '@schema/models/auth/auth.guard';
import User from '@schema/models/users/users.model';
import FriendConnection, {
  FriendPaginationInput
} from '@schema/models/friends/friends.model.pagination';
import { getRepository } from 'typeorm';
import MeQuery from '@schema/models/me/me.query';
import FriendEntity from '@db/entities/friend.entity';
import {
  GraphqlCursorPagination,
  GraphqlPaginationArg,
  GraphqlPaginationSortArg,
  makeFormatedField,
  makeSelectField,
  makeUniqueField
} from '@lib/pagination/pagination';
import { GraphqlFilter, GraphqlFilterArg } from '@lib/filter/filter';
import { FriendsFilter } from './friends.dto';

@UseGuards(AuthGuard)
@Resolver(() => MeQuery)
export class FriendsResolver {
  @GraphqlFilter()
  @GraphqlCursorPagination({
    uniqueKey: makeUniqueField('friend', 'id'),
    formatter: node => ({
      id: node[makeFormatedField('friend', 'id')],
      name: node[makeFormatedField('friend', 'name')],
      email: node[makeFormatedField('friend', 'email')],
      avatarURL: node[makeFormatedField('friend', 'avatarURL')]
    })
  })
  @ResolveField('friends', () => FriendConnection)
  public async getFriends(
    @Parent() user: User,
    @GraphqlPaginationArg(() => FriendPaginationInput) pagination,
    @GraphqlPaginationSortArg() sort,
    @GraphqlFilterArg(() => FriendsFilter) filter
  ): Promise<FriendConnection> {
    const builder = getRepository(FriendEntity)
      .createQueryBuilder('friends')
      .select(makeSelectField('friend', 'id'))
      .addSelect(makeSelectField('friend', 'name'))
      .addSelect(makeSelectField('friend', 'email'))
      .addSelect(makeSelectField('friend', 'avatarURL'))
      .leftJoin('friends.user', 'user')
      .leftJoin('friends.friend', 'friend')
      .where('"user"."id" = :userId', { userId: user.id })
      .andWhere('"friends"."is_deleted" = :isDeleted', { isDeleted: false });
    return builder;
  }
}

export default FriendsResolver;
