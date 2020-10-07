import { Module } from '@nestjs/common';
import MessagesController from '@modules/messages/messages.controller';
import MessagesService from '@modules/messages/messages.service';
import MembersModule from '@modules/members/members.module';
import ChatsModule from '@modules/chats/chats.module';

@Module({
    imports: [MembersModule, ChatsModule],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService]
})
export class MessagesModule {}

export default MessagesModule;