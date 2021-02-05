import { Module } from '@nestjs/common';
import MessagesService from '@schema/models/messages/messages.service';
import MembersModule from '@schema/models/members/members.module';
import MessagesModelResolver from '@schema/models/messages/messages.model.resolver';
import ChatModule from '@schema/models/chats/chats.module';
import MessagesMutationResolver from '@schema/models/messages/messages.mutation.resolver';
import Message from '@db/entities/message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [MembersModule, ChatModule, TypeOrmModule.forFeature([Message])],
  providers: [MessagesService, MessagesModelResolver, MessagesMutationResolver],
  exports: [MessagesService]
})
export class MessagesModule {}

export default MessagesModule;
