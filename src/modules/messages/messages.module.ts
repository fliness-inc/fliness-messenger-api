import { Module, forwardRef } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageEntity } from '~/db/entities/message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '~/modules/members/members.module';
import { ChatsModule } from '~/modules/chats/chats.module';
import { MessagesGateway } from './messages.gateway';
import { TokensModule } from '~/modules/tokens/tokens.module';

@Module({
  imports: [
    MembersModule,
    TokensModule,
    forwardRef(() => ChatsModule),
    TypeOrmModule.forFeature([MessageEntity]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}

export default MessagesModule;
