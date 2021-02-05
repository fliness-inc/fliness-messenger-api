import { Module, forwardRef } from '@nestjs/common';
import MembersService from '@schema/models/members/members.service';
import UsersModule from '@schema/models/users/users.module';
import ChatsModule from '@schema/models/chats/chats.module';
import MembersQueryResolver from '@schema/models/members/members.query.resolver';
import MembersModuleResolver from '@schema/models/members/members.model.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import MemberEntity from '@db/entities/member.entity';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ChatsModule),
    TypeOrmModule.forFeature([MemberEntity])
  ],
  providers: [MembersQueryResolver, MembersModuleResolver, MembersService],
  exports: [MembersService]
})
export class MembersModule {}

export default MembersModule;
