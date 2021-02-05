import { UseGuards } from '@nestjs/common';
import { Resolver, ResolveField, Field } from '@nestjs/graphql';
import AuthGuard from '@schema/models/auth/auth.guard';
import CurrentUser from '@schema/models/auth/current-user';
import User from '@schema/models/users/users.model';
import MeQuery from '@schema/models/me/me.query';
import ChatsConnection, {
  ChatPaginationInput
} from '@schema/models/chats/chats.model.pagination';
import ChatEntity from '@db/entities/chat.entity';
import { getRepository } from 'typeorm';
import {
  GraphqlCursorPagination,
  GraphqlPaginationArg,
  GraphqlPaginationSortArg,
  makeFormatedField,
  makeSelectField,
  makeUniqueField
} from '@lib/pagination/pagination';
import { ChatsFilter } from '@schema/models/chats/chats.dto';
import { GraphqlFilter, GraphqlFilterArg } from '@lib/filter/filter';

@UseGuards(AuthGuard)
@Resolver(() => MeQuery)
export class ChatsModelResolver {
  @Field(() => ChatsConnection)
  public readonly chats: ChatsConnection;

  @GraphqlFilter()
  @GraphqlCursorPagination({
    uniqueKey: makeUniqueField('chats', 'id'),
    formatter: node => ({
      id: node[makeFormatedField('chats', 'id')],
      title: node[makeFormatedField('chats', 'title')],
      description: node[makeFormatedField('chats', 'description')],
      createdAt: node[makeFormatedField('chats', 'created_at')],
      type: node[makeFormatedField('type', 'name')]
    })
  })
  @ResolveField(() => ChatsConnection, { name: 'chats' })
  public async getChats(
    @CurrentUser() user: User,
    @GraphqlPaginationArg(() => ChatPaginationInput) pagination,
    @GraphqlPaginationSortArg() sort,
    @GraphqlFilterArg(() => ChatsFilter) filter
  ): Promise<ChatsConnection> {
    const builder = getRepository(ChatEntity)
      .createQueryBuilder('chats')
      .select(makeSelectField('chats', 'id'))
      .addSelect(makeSelectField('chats', 'title'))
      .addSelect(makeSelectField('chats', 'description'))
      .addSelect(makeSelectField('chats', 'created_at'))
      .addSelect(makeSelectField('type', 'name'))
      .leftJoin('chats.type', 'type')
      .leftJoin('chats.members', 'members')
      .where('chats.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('members.user_id = :userId', { userId: user.id });
    return builder;
  }
}

export default ChatsModelResolver;
