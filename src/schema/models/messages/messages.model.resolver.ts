import { UseGuards } from '@nestjs/common';
import { Resolver, Field, ResolveField, Parent } from '@nestjs/graphql';
import AuthGuard from '@schema/models/auth/auth.guard';
import Chat from '@schema/models/chats/chats.model';
import MessageEntity from '@db/entities/message.entity';
import {
  MessageConnection,
  MessagePaginationInput
} from '@schema/models/messages/messages.model.pagination';
import {
  GraphqlCursorPagination,
  makeUniqueField,
  makeFormatedField,
  makeSelectField,
  GraphqlPaginationArg,
  GraphqlPaginationSortArg
} from '@lib/pagination/pagination';
import { getRepository } from 'typeorm';
import { MessagesFilter } from './messages.dto';
import { GraphqlFilterArg, GraphqlFilter } from '@lib/filter/filter';

@UseGuards(AuthGuard /*, ChatGruard */)
@Resolver(() => Chat)
export class MessagesModelResolver {
  @Field(() => MessageConnection)
  public readonly messages: MessageConnection;

  //@ChatRoles(MemberRoleEnum.MEMBER)
  @GraphqlFilter()
  @GraphqlCursorPagination({
    uniqueKey: makeUniqueField('messages', 'id'),
    formatter: node => ({
      id: node[makeFormatedField('messages', 'id')],
      text: node[makeFormatedField('messages', 'text')],
      memberId: node[makeFormatedField('messages', 'member_id')],
      updatedAt: node[makeFormatedField('messages', 'updated_at')],
      createdAt: node[makeFormatedField('messages', 'created_at')]
    })
  })
  @ResolveField(() => MessageConnection, { name: 'messages' })
  public async getMessages(
    @Parent() chat: Chat,
    @GraphqlPaginationArg(() => MessagePaginationInput) pagination,
    @GraphqlPaginationSortArg() sort,
    @GraphqlFilterArg(() => MessagesFilter) filter
  ): Promise<MessageConnection> {
    const builder = getRepository(MessageEntity)
      .createQueryBuilder('messages')
      .select(makeSelectField('messages', 'id'))
      .addSelect(makeSelectField('messages', 'text'))
      .addSelect(makeSelectField('messages', 'member_id'))
      .addSelect(makeSelectField('messages', 'updated_at'))
      .addSelect(makeSelectField('messages', 'created_at'))
      .leftJoin('messages.member', 'member')
      .where('member.chat_id = :chatId', { chatId: chat.id })
      .andWhere('messages.is_deleted = :isDeleted', { isDeleted: false });

    return builder;
  }
}

export default MessagesModelResolver;
