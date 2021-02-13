import { Inject } from '@nestjs/common';
import { ResolveField, Resolver, Args } from '@nestjs/graphql';
import MessagesService from '@schema/models/messages/messages.service';
import { MessageCreateDTO } from '@schema/models/messages/messages.dto';
import { ChatRoles, MemberRoleEnum } from '@schema/models/chats/chats.guard';
import Message from '@schema/models/messages/messages.model';
import MessagesMutation from '@schema/models/messages/messages.mutation';
import CurrentUser from '@schema/models/auth/current-user';
import User from '@schema/models/users/users.model';
import UUID from '@schema/types/uuid.type';
import { PubSubEngine } from 'graphql-subscriptions';
import { MessageEvents } from './messages.dto';

@ChatRoles(MemberRoleEnum.MEMBER)
@Resolver(() => MessagesMutation)
export class MessagesMutationResolver {
  public constructor(
    @Inject('PUB_SUB') private pubSub: PubSubEngine,
    private readonly messagesService: MessagesService
  ) {}

  @ResolveField(() => UUID, { name: 'id' })
  public staticId(): string {
    return '7471d679-75d7-41f5-84b6-4379379e7f60';
  }

  @ResolveField(() => Message, { name: 'create' })
  public async create(
    @CurrentUser() user: User,
    @Args('payload') payload: MessageCreateDTO
  ): Promise<Message> {
    const entity = await this.messagesService.create(
      user.id,
      payload.chatId,
      payload
    );

    const message = {
      id: entity.id,
      text: entity.text,
      memberId: entity.memberId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };

    this.pubSub.publish(MessageEvents.CREATED_EVENT, {
      chatId: (
        await this.messagesService.findOne({
          where: { id: entity.id },
          join: {
            alias: 'messages',
            leftJoinAndSelect: {
              member: 'messages.member'
            }
          }
        })
      ).member.chatId,
      [MessageEvents.CREATED_EVENT]: message
    });

    return message;
  }

  @ResolveField(() => Message, { name: 'remove' })
  public async remove(
    @CurrentUser() user: User,
    @Args('messageId', { type: () => UUID }) messageId: string
  ): Promise<Message> {
    const entity = await this.messagesService.remove(user.id, messageId);

    const message = {
      id: entity.id,
      text: entity.text,
      memberId: entity.memberId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };

    this.pubSub.publish(MessageEvents.REMOVED_EVENT, {
      chatId: (
        await this.messagesService.findOne({
          where: { id: entity.id },
          join: {
            alias: 'messages',
            leftJoinAndSelect: {
              'messages.member': 'member'
            }
          }
        })
      ).member.chatId,
      [MessageEvents.REMOVED_EVENT]: message
    });

    return message;
  }
}

export default MessagesMutationResolver;
