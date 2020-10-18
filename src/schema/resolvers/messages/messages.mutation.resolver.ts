import { UseGuards } from '@nestjs/common';
import { ResolveField, Resolver, Args } from '@nestjs/graphql';
import MessagesService from '@schema/resolvers/messages/messages.service';
import { MessageCreateDTO } from '@schema/resolvers/messages/messages.dto';
import { ChatGruard, ChatRoles, MemberRoleEnum } from '@schema/resolvers/chats/chats.guard';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import Message from '@schema/models/messages.model';
import MessagesMutation from '@schema/models/messages.mutation';
import CurrentUser from '@schema/resolvers/auth/current-user';
import User from '@schema/models/user';
import UUID from '@schema/types/uuid';

@UseGuards(AuthGuard)
@ChatRoles(MemberRoleEnum.MEMBER)
@Resolver(of => MessagesMutation)
export class MessagesMutationResolver {

    public constructor(private readonly messagesService: MessagesService) {}

    @ResolveField(type => Message, { name: 'create' })
    public async create(
        @CurrentUser() user: User,
        @Args('payload') payload: MessageCreateDTO
    ): Promise<Message> {
        const message = await this.messagesService.create(user.id, payload.chatId, payload);
        return {
            id: message.id,
            text: message.text,
            memberId: message.memberId,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        }
    }

    @ResolveField(type => Message, { name: 'remove' })
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
        }
    }
}

export default MessagesMutationResolver;