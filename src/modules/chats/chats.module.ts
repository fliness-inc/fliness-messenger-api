import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatEntity } from '~/db/entities/chat.entity';
import { ChatTypeEntity } from '~/db/entities/chat-type.entity';
import { UsersModule } from '~/modules/users/users.module';
import { MembersModule } from '~/modules/members/members.module';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.contoller';
import { MessagesModule } from '~/modules/messages/messages.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => MembersModule),
    forwardRef(() => MessagesModule),
    TypeOrmModule.forFeature([ChatEntity, ChatTypeEntity]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}

export default ChatsModule;
