import { Resolver, ResolveField, Field, Parent } from '@nestjs/graphql';
import Chat from '@schema/models/chats/chats.model';
import MemberConnection, {
  MemberPaginationInput
} from '@schema/models/members/members.model.pagination';
import { InjectRepository } from '@nestjs/typeorm';
import Member from '@db/entities/member.entity';
import { Repository } from 'typeorm';
import { GraphqlFilter, GraphqlFilterArg } from '@lib/filter/filter';
import { MembersFilter } from '@schema/models/members/members.dto';
import {
  GraphqlCursorPagination,
  GraphqlPaginationArg,
  GraphqlPaginationSortArg,
  makeFormatedField,
  makeSelectField,
  makeUniqueField
} from '@lib/pagination/pagination';

@Resolver(() => Chat)
export class MembersQueryResolver {
  public constructor(
    @InjectRepository(Member)
    private readonly membersRespository: Repository<Member>
  ) {}

  @Field(() => MemberConnection, { name: 'members' })
  public readonly members: MemberConnection;

  @GraphqlFilter()
  @GraphqlCursorPagination({
    uniqueKey: makeUniqueField('members', 'id'),
    formatter: node => ({
      id: node[makeFormatedField('members', 'id')],
      chatId: node[makeFormatedField('members', 'chat_id')],
      userId: node[makeFormatedField('members', 'user_id')],
      updatedAt: node[makeFormatedField('members', 'updated_at')],
      createdAt: node[makeFormatedField('members', 'created_at')],
      role: node[makeFormatedField('role', 'name')]
    })
  })
  @ResolveField(() => MemberConnection, { name: 'members' })
  public async getMembers(
    @Parent() chat: Chat,
    @GraphqlPaginationArg(() => MemberPaginationInput) pagination,
    @GraphqlPaginationSortArg() sort,
    @GraphqlFilterArg(() => MembersFilter) filter
  ): Promise<MemberConnection> {
    const builder = this.membersRespository
      .createQueryBuilder('members')
      .select(makeSelectField('members', 'id'))
      .addSelect(makeSelectField('members', 'chat_id'))
      .addSelect(makeSelectField('members', 'user_id'))
      .addSelect(makeSelectField('members', 'updated_at'))
      .addSelect(makeSelectField('members', 'created_at'))
      .addSelect(makeSelectField('role', 'name'))
      .leftJoin('members.role', 'role')
      .where('members.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('members.chat_id = :chatId', { chatId: chat.id });
    return builder;
  }
}

export default MembersQueryResolver;
