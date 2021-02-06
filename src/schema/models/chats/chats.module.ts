import { Module, forwardRef } from '@nestjs/common';
import UsersModule from '@schema/models/users/users.module';
import MembersModule from '@schema/models/members/members.module';
import ChatsModelResolver from '@schema/models/chats/chats.query.resolver';
import ChatsMutationResolver from '@schema/models/chats/chats.mutation.resolver';
import ChatsService from '@schema/models/chats/chats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import ChatEntity from '@db/entities/chat.entity';
import ChatTypeEntity from '@db/entities/chat-type.entity';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => MembersModule),
    TypeOrmModule.forFeature([ChatEntity, ChatTypeEntity])
  ],
  providers: [ChatsModelResolver, ChatsMutationResolver, ChatsService],
  exports: [ChatsService]
})
export class ChatsModule {}

export default ChatsModule;
