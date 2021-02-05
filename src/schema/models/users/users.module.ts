import { Module } from '@nestjs/common';
import UsersService from '@schema/models/users/users.service';
import UsersQueryResolver from '@schema/models/users/users.query.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from '@db/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UsersQueryResolver],
  exports: [UsersService]
})
export class UsersModule {}

export default UsersModule;
