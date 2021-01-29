import { Module } from '@nestjs/common';
import UsersService from '@schema/resolvers/users/users.service';
import UsersQueryResolver from '@schema/resolvers/users/users.query.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from '@database/entities/user';

@Module({
	imports: [
		TypeOrmModule.forFeature([User])
	],
	providers: [
		UsersService,
		UsersQueryResolver
	],
	exports: [UsersService]
})
export class UsersModule {}

export default UsersModule;