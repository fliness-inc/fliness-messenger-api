import { Resolver, Query, Context } from '@nestjs/graphql';
import CurrentUser from '@schema/models/auth/current-user';
import User from '@schema/models/users/users.model';
import UserConnection, {
  UserPaginationInput
} from '@schema/models/users/users.model.pagination';
import { getRepository } from 'typeorm';
import UserEntity from '@db/entities/user.entity';
import {
  GraphqlCursorPagination,
  GraphqlPaginationArg,
  GraphqlPaginationSortArg,
  makeFormatedField,
  makeSelectField,
  makeUniqueField
} from '@lib/pagination/pagination';
import { UsersFilter } from '@schema/models/users/users.dto';
import { GraphqlFilter, GraphqlFilterArg } from '@lib/filter/filter';

@Resolver(of => User)
export class UsersQueryResolver {
  @GraphqlFilter()
  @GraphqlCursorPagination({
    uniqueKey: makeUniqueField('users', 'id'),
    formatter: node => ({
      id: node[makeFormatedField('users', 'id')],
      name: node[makeFormatedField('users', 'name')],
      email: node[makeFormatedField('users', 'email')],
      avatarURL: node[makeFormatedField('users', 'avatarURL')]
    })
  })
  @Query(() => UserConnection, { name: 'users' })
  public async getUsers(
    @CurrentUser() user: User,
    @Context() ctx,
    @GraphqlPaginationArg(() => UserPaginationInput) pagination,
    @GraphqlPaginationSortArg() sort,
    @GraphqlFilterArg(() => UsersFilter) filter
  ): Promise<UserConnection> {
    const builder = getRepository(UserEntity)
      .createQueryBuilder('users')
      .select(makeSelectField('users', 'id'))
      .addSelect(makeSelectField('users', 'name'))
      .addSelect(makeSelectField('users', 'email'))
      .addSelect(makeSelectField('users', 'avatarURL'))
      .where('users.is_deleted = :isDeleted', { isDeleted: false });

    return builder;
  }
}

export default UsersQueryResolver;
