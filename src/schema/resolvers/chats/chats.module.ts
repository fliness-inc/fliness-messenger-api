import { Module, forwardRef } from '@nestjs/common';
import UsersModule from '@schema/resolvers/users/users.module'; 
import MembersModule from '@schema/resolvers/members/members.module';
import ChatsModelResolver from '@schema/resolvers/chats/chats.model.resolver';
import ChatsMutationResolver from '@schema/resolvers/chats/chats.mutation.resolver';
import ChatsService from '@schema/resolvers/chats/chats.service';

@Module({
    imports: [UsersModule, forwardRef(() => MembersModule)],
    providers: [ChatsModelResolver, ChatsMutationResolver, ChatsService],
    exports: [ChatsService]
})
export class ChatsModule {}

export default ChatsModule;