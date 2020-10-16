import { UseGuards} from '@nestjs/common';
import { Resolver, ResolveField, Args, Field } from '@nestjs/graphql';
import { ChatsService } from '@schema/resolvers/chats/chats.service';
import AuthGuard from '@schema/resolvers/auth/auth.guard';
import { ChatTypeEnum, ChatCreateDTO } from '@schema/resolvers/chats/chats.dto';
import { ChatGruard, ChatRoles } from '@schema/resolvers/chats/chats.guard';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';
import ChatsQuery from '@schema/models/chats.mutation';
import Chat from '@schema/models/chat.model';
import CurrentUser from '@schema/resolvers/auth/current-user';
import User from '@schema/models/user';
import UUID from '@schema/types/uuid';

@UseGuards(AuthGuard)
@Resolver(of => User)
export class ChatModelResolver {

    public constructor(private readonly chatService: ChatsService) {}

    @Field(type => [Chat])
    public readonly chats: Chat[];

    @ResolveField(type => [Chat], { name: 'chats' })
    public async getChats(
        @CurrentUser() user: User
    ): Promise<Chat[]> {
        return [];
    }
}

export default ChatModelResolver;