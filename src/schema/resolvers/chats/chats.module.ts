import { Module, forwardRef } from '@nestjs/common';
import ChatsMutationResolver from '@schema/resolvers/chats/chats.mutation.resolver';
import ChatsService from '@schema/resolvers/chats/chats.service';
import UsersModule from '@schema/resolvers/users/users.module'; 
import MembersModule from '@schema/resolvers/members/members.module';
import ChatModelResolver from '@schema/resolvers/chats/chat.model.resolver';

@Module({
    imports: [UsersModule, forwardRef(() => MembersModule)],
    providers: [ChatModelResolver, ChatsMutationResolver, ChatsService],
    exports: [ChatsService]
})
export class ChatsModule {}

export default ChatsModule;