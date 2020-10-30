import { Module, forwardRef } from '@nestjs/common';
import MembersService from '@schema/resolvers/members/members.service';
import UsersModule from '@schema/resolvers/users/users.module';
import ChatsModule from '@schema/resolvers/chats/chats.module';
import MembersQueryResolver from '@schema/resolvers/members/members.query.resolver';
import MembersModuleResolver from '@schema/resolvers/members/members.model.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Member from '@database/entities/member';

@Module({
    imports: [UsersModule, forwardRef(() => ChatsModule), TypeOrmModule.forFeature([Member])],
    providers: [MembersQueryResolver, MembersModuleResolver, MembersService],
    exports: [MembersService]
})
export class MembersModule {}

export default MembersModule;