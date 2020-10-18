import { Module } from '@nestjs/common';
import UsersService from '@schema/resolvers/users/users.service';
import UsersResolver from '@schema/resolvers/users/users.resolver';

@Module({
    providers: [UsersService, UsersResolver],
    exports: [UsersService]
})
export class UsersModule {}

export default UsersModule;