import { Module, forwardRef } from '@nestjs/common';
import MembersService from '@schema/resolvers/members/members.service';
import UsersModule from '@schema/resolvers/users/users.module';
import ChatsModule from '@schema/resolvers/chats/chats.module';
import MembersResolver from '@schema/resolvers/members/members.resolver';

@Module({
    imports: [UsersModule, forwardRef(() => ChatsModule)],
    providers: [MembersResolver, MembersService],
    exports: [MembersService]
})
export class MembersModule {}

export default MembersModule;