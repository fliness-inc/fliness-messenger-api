/* import { Module, forwardRef } from '@nestjs/common';
import ChatsController from '@modules/chats/chats.controller';
import ChatsService from '@modules/chats/chats.service';
import UsersModule from '@modules/users/users.module'; 
import MembersModule from '@modules/members/members.module';

@Module({
    imports: [UsersModule, forwardRef(() => MembersModule)],
    controllers: [ChatsController],
    providers: [ChatsService],
    exports: [ChatsService]
})
export class ChatsModule {}

export default ChatsModule; */