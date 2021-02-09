import { UseGuards, Inject } from '@nestjs/common';
import { Resolver, ResolveField, Args } from '@nestjs/graphql';
import { ChatsService } from './chats.service';
import { ChatTypeEnum, ChatCreateDTO, ChatEvents } from './chats.dto';
import { ChatGruard, ChatRoles } from './chats.guard';
import { MemberRoleEnum } from '@schema/models/members/members.dto';
import ChatsMutation from './chats.mutation';
import Chat from './chats.model';
import CurrentUser from '@schema/models/auth/current-user';
import User from '@schema/models/users/users.model';
import UUID from '@schema/types/uuid.type';
import MessagesMutation from '@schema/models/messages/messages.mutation';
import { PubSubEngine } from 'graphql-subscriptions';

@Resolver(() => ChatsMutation)
export class ChatsMutationResolver {
  public constructor(
    private readonly chatService: ChatsService,
    @Inject('PUB_SUB') private pubSub: PubSubEngine
  ) {}

  @ResolveField(() => Chat, { name: 'create' })
  public async create(
    @CurrentUser() user: User,
    @Args('payload') payload: ChatCreateDTO
  ): Promise<Chat> {
    const entity = await this.chatService.create(
      user.id,
      payload.type,
      payload
    );

    const chat = {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: <ChatTypeEnum>entity.type.name,
      createdAt: entity.createdAt
    };

    this.pubSub.publish(ChatEvents.CREATED_EVENT, {
      [ChatEvents.CREATED_EVENT]: chat
    });

    return chat;
  }

  @UseGuards(ChatGruard)
  @ChatRoles(MemberRoleEnum.CREATOR)
  @ResolveField(() => Chat, { name: 'remove' })
  public async remove(
    @CurrentUser() user: User,
    @Args('chatId', { type: () => UUID }) chatId: string
  ): Promise<Chat> {
    const chat = await this.chatService.remove(chatId);
    return {
      id: chat.id,
      title: chat.title,
      description: chat.description,
      type: <ChatTypeEnum>chat.type.name,
      createdAt: chat.createdAt
    };
  }

  @ResolveField(() => MessagesMutation, { name: 'messages' })
  public async messages(): Promise<MessagesMutation> {
    return <MessagesMutation>{};
  }
}

export default ChatsMutationResolver;
