import { UseGuards } from '@nestjs/common';
import { ResolveField, Resolver, Args } from '@nestjs/graphql';
import MessagesService from '@schema/models/messages/messages.service';
import { MessageCreateDTO } from '@schema/models/messages/messages.dto';
import { ChatRoles, MemberRoleEnum } from '@schema/models/chats/chats.guard';
import Message from '@schema/models/messages/messages.model';
import MessagesMutation from '@schema/models/messages/messages.mutation';
import CurrentUser from '@schema/models/auth/current-user';
import User from '@schema/models/users/users.model';
import UUID from '@schema/types/uuid.type';

@ChatRoles(MemberRoleEnum.MEMBER)
@Resolver(() => MessagesMutation)
export class MessagesMutationResolver {
  public constructor(private readonly messagesService: MessagesService) {}

  @ResolveField(() => UUID, { name: 'id' })
  public staticId(): string {
    return '7471d679-75d7-41f5-84b6-4379379e7f60';
  }

  @ResolveField(() => Message, { name: 'create' })
  public async create(
    @CurrentUser() user: User,
    @Args('payload') payload: MessageCreateDTO
  ): Promise<Message> {
    const message = await this.messagesService.create(
      user.id,
      payload.chatId,
      payload
    );
    return {
      id: message.id,
      text: message.text,
      memberId: message.memberId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }

  @ResolveField(() => Message, { name: 'remove' })
  public async remove(
    @CurrentUser() user: User,
    @Args('messageId', { type: () => UUID }) messageId: string
  ): Promise<Message> {
    const message = await this.messagesService.remove(user.id, messageId);
    return {
      id: message.id,
      text: message.text,
      memberId: message.memberId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }
}

export default MessagesMutationResolver;
