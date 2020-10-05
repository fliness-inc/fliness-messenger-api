import { Module, forwardRef } from '@nestjs/common';
import MembersService from '@modules/members/members.service';
import UsersModule from '@modules/users/users.module';
import ChatModule from '@modules/chat/chat.module';
import MembersController from '@modules/members/members.controller';

@Module({
    imports: [UsersModule, forwardRef(() => ChatModule)],
    controllers: [MembersController],
    providers: [MembersService],
    exports: [MembersService]
})
export class MembersModule {}

export default MembersModule;