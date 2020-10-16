import { UseGuards} from '@nestjs/common';
import { Resolver, ResolveField, Args } from '@nestjs/graphql';
import { ChatsService } from '@schema/resolvers/chats/chats.service';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import { ChatTypeEnum, ChatCreateDTO } from '@schema/resolvers/chats/chats.dto';
import { ChatGruard, ChatRoles } from '@schema/resolvers/chats/chats.guard';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';
import ChatsMutation from '@schema/models/chats.mutation';
import Chat from '@schema/models/chats.model';
import CurrentUser from '@schema/resolvers/auth/current-user';
import User from '@schema/models/user';
import UUID from '@schema/types/uuid';
import MessagesMutation from '@schema/models/messages.mutation';

@UseGuards(AuthGuard)
@Resolver(of => ChatsMutation)
export class ChatsMutationResolver {

    public constructor(private readonly chatService: ChatsService) {}

    @ResolveField(type => Chat, { name: 'create' })
    public async create(
        @CurrentUser() user: User,
        @Args('payload') payload: ChatCreateDTO
    ): Promise<Chat> {
        const chat = await this.chatService.create(user.id, payload.type, payload);
        return {
            id: chat.id,
            title: chat.title,
            description: chat.description,
            type: <ChatTypeEnum>chat.type.name,
            createdAt: chat.createdAt
        };
    }

    @UseGuards(ChatGruard)
    @ChatRoles(MemberRoleEnum.CREATOR)
    @ResolveField(type => Chat, { name: 'remove' })
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

    @ResolveField(type => MessagesMutation, { name: 'messages' })
    public async messages(): Promise<MessagesMutation> {
        return <MessagesMutation>{};
    }
}

export default ChatsMutationResolver;