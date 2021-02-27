import { Module, forwardRef } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageEntity } from '~/db/entities/message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '~/modules/members/members.module';
import { ChatsModule } from '~/modules/chats/chats.module';

@Module({
  imports: [
    MembersModule,
    forwardRef(() => ChatsModule),
    TypeOrmModule.forFeature([MessageEntity]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}

export default MessagesModule;
