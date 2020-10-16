import { Module } from '@nestjs/common';
import MessagesService from '@schema/resolvers/messages/messages.service';
import MembersModule from '@schema/resolvers/members/members.module';
import MessagesModelResolver from '@schema/resolvers/messages/messages.model.resolver';
import ChatModule from '@schema/resolvers/chats/chats.module';
import MessagesMutationResolver from '@schema/resolvers/messages/messages.mutation.resolver';

@Module({
    imports: [MembersModule, ChatModule],
    providers: [MessagesService, MessagesModelResolver, MessagesMutationResolver],
    exports: [MessagesService]
})
export class MessagesModule {}

export default MessagesModule;