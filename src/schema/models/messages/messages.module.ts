import { Module, forwardRef } from '@nestjs/common';
import { MessagesService } from '@schema/models/messages/messages.service';
import { MembersModule } from '@schema/models/members/members.module';
import { MessagesModelResolver } from '@schema/models/messages/messages.model.resolver';
import { ChatsModule } from '@schema/models/chats/chats.module';
import { MessagesMutationResolver } from '@schema/models/messages/messages.mutation.resolver';
import { Message as MessageEntity } from '@db/entities/message.entity';
import { ViewMessage as ViewMessageEntity } from '@db/entities/views-messages.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSubModule } from '@schema/pub-sub/pub-sub.module';
import { MessagesSubsResolver } from './messages.subs.resolver';

@Module({
  imports: [
    MembersModule,
    ChatsModule,
    TypeOrmModule.forFeature([MessageEntity, ViewMessageEntity]),
    PubSubModule
  ],
  providers: [
    MessagesService,
    MessagesModelResolver,
    MessagesMutationResolver,
    MessagesSubsResolver
  ],
  exports: [MessagesService]
})
export class MessagesModule {}

export default MessagesModule;
