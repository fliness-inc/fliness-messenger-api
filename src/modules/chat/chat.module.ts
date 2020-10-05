import { Module, forwardRef } from '@nestjs/common';
import ChatController from '@modules/chat/chat.controller';
import ChatService from '@modules/chat/chat.service';
import UsersModule from '@modules/users/users.module'; 
import MembersModule from '@modules/members/members.module';

@Module({
    imports: [UsersModule, forwardRef(() => MembersModule)],
    controllers: [ChatController],
    providers: [ChatService],
    exports: [ChatService]
})
export class ChatModule {}

export default ChatModule;