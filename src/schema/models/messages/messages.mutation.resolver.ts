import { Inject } from '@nestjs/common';
import { ResolveField, Resolver, Args, Int } from '@nestjs/graphql';
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
import { MembersService } from '@schema/models/members/members.service';
import { NotFoundError } from '@src/errors';
import { Not } from 'typeorm';

@ChatRoles(MemberRoleEnum.MEMBER)
@Resolver(() => MessagesMutation)
export class MessagesMutationResolver {
  public constructor(
    @Inject('PUB_SUB') private pubSub: PubSubEngine,
    private readonly messagesService: MessagesService,
    private readonly membersService: MembersService
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
    const member = await this.membersService.findOne({
      where: {
        userId: user.id,
        chatId: payload.chatId
      }
    });

    if (!member) throw new NotFoundError(`The member was not found`);

    const entity = await this.messagesService.create(member.id, payload);

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
              member: 'messages.member'
            }
          }
        })
      ).member.chatId,
      [MessageEvents.REMOVED_EVENT]: message
    });

    return message;
  }

  @ResolveField(() => Boolean, { name: 'setView' })
  public async setView(
    @CurrentUser() user,
    @Args('messageId', { type: () => UUID }) messageId: string
  ): Promise<boolean> {
    const message = await this.messagesService.findOne({
      select: ['id', 'memberId'],
      where: { id: messageId }
    });

    if (!message) throw new Error(`The message was not found`);

    const creatorMember = await this.membersService.findOne({
      select: ['chatId'],
      where: { id: message.memberId }
    });

    const currentMember = await this.membersService.findOne({
      select: ['id'],
      where: {
        id: Not(message.memberId),
        chatId: creatorMember.chatId,
        userId: user.id
      }
    });

    if (!currentMember) throw new Error(`The current member was not found`);

    return (
      (await this.messagesService.setView(message.id, currentMember.id)) !==
      undefined
    );
  }

  @ResolveField(() => Int, { name: 'setAllViews' })
  public async setAllViews(
    @CurrentUser() user,
    @Args('chatId', { type: () => UUID }) chatId: string
  ): Promise<number> {
    const member = await this.membersService.findOne({
      select: ['id'],
      where: {
        chatId,
        userId: user.id
      }
    });

    if (!member) throw new Error(`The member was not found`);

    return this.messagesService.setAllViews(member.id);
  }
}

export default MessagesMutationResolver;
