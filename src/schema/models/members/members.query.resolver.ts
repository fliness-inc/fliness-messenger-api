import {
  Resolver,
  ResolveField,
  Field,
  Parent,
  Context,
  Info
} from '@nestjs/graphql';
import ChatModel from '@schema/models/chats/chats.model';
import MemberConnection, {
  MemberPaginationInput
} from '@schema/models/members/members.model.pagination';
import { InjectRepository } from '@nestjs/typeorm';
import MemberEntity from '@db/entities/member.entity';
import MemberModel from './members.model';
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
import MessageModel from '@schema/models/messages/messages.model';
import DataLoader from 'dataloader';
import { Context as AppContext } from '@schema/utils';

@Resolver(() => ChatModel)
export class ChatQueryResolver {
  public constructor(
    @InjectRepository(MemberEntity)
    private readonly membersRespository: Repository<MemberEntity>
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
    @Parent() chat: ChatModel,
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

@Resolver(() => MessageModel)
export class MessageQueryResolver {
  public constructor(
    @InjectRepository(MemberEntity)
    private readonly membersRespository: Repository<MemberEntity>
  ) {}

  @ResolveField(() => MemberModel, { name: 'member' })
  public async getMember(
    @Parent() message: MessageModel,
    @Context() ctx: AppContext,
    @Info() info
  ): Promise<MemberModel> {
    const { dataloaders } = ctx;
    let dataloader = dataloaders.get(info.fieldNodes);

    if (!dataloader) {
      dataloader = new DataLoader(async (ids: readonly string[]) => {
        const entities = await this.membersRespository
          .createQueryBuilder('members')
          .select('members.id', 'id')
          .addSelect('members.chat_id', 'chatId')
          .addSelect('members.user_id', 'userId')
          .addSelect('members.updated_at', 'updatedAt')
          .addSelect('members.created_at', 'createdAt')
          .addSelect('role.name', 'type')
          .leftJoin('members.role', 'role')
          .whereInIds(ids)
          .getRawMany();
        return ids.map(id => entities.find(e => e.id === id));
      });

      dataloaders.set(info.fieldNodes, dataloader);
    }
    return dataloader.load(message.memberId);
  }
}
