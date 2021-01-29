import { Module } from '@nestjs/common';
import FriendsResolver from '@schema/resolvers/friends/friends.query.resolver';
import FriendsService from '@schema/resolvers/friends/friends.service';
import UsersModule from '@schema/resolvers/users/users.module';
import FriendEntity from '@database/entities/friend';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [UsersModule, TypeOrmModule.forFeature([FriendEntity])],
	providers: [FriendsResolver, FriendsService],
	exports: [FriendsService]
})
export class FriendsModule {}

export default FriendsModule;