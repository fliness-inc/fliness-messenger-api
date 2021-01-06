import { Module } from '@nestjs/common';
import UsersService from '@schema/resolvers/users/users.service';
import UsersQueryResolver from '@schema/resolvers/users/users.query.resolver';

@Module({
	providers: [UsersService, UsersQueryResolver],
	exports: [UsersService]
})
export class UsersModule {}

export default UsersModule;