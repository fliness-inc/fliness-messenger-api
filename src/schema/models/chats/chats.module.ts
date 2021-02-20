import { Module, forwardRef } from '@nestjs/common';
import UsersModule from '@schema/models/users/users.module';
import MembersModule from '@schema/models/members/members.module';
import { ChatsQueryResolver } from './chats.query.resolver';
import { ChatsModelResolver } from './chats.model.resolver';
import { ChatsMutationResolver } from './chats.mutation.resolver';
import { ChatsService } from './chats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import ChatEntity from '@db/entities/chat.entity';
import ChatTypeEntity from '@db/entities/chat-type.entity';
import ChatsSubsResolver from './chats.subs.resolver';
import PubSubModule from '@schema/pub-sub/pub-sub.module';
import { MessagesModule } from '@schema/models/messages/messages.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => MembersModule),
    forwardRef(() => MessagesModule),
    TypeOrmModule.forFeature([ChatEntity, ChatTypeEntity]),
    PubSubModule
  ],
  providers: [
    ChatsModelResolver,
    ChatsQueryResolver,
    ChatsMutationResolver,
    ChatsSubsResolver,
    ChatsService
  ],
  exports: [ChatsService]
})
export class ChatsModule {}

export default ChatsModule;
