import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from '~/modules/members/members.service';
import { UsersModule } from '~/modules/users/users.module';
import { ChatsModule } from '~/modules/chats/chats.module';
import { MemberEntity } from '~/db/entities/member.entity';
import { MemberRoleEntity } from '~/db/entities/member-role.entity';
import { MembersController } from './members.controller';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ChatsModule),
    TypeOrmModule.forFeature([MemberEntity, MemberRoleEntity]),
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}

export default MembersModule;
