import { Module } from '@nestjs/common';
import FriendsResolver from '@schema/resolvers/friends/friends.resolver';
import FriendsService from '@schema/resolvers/friends/friends.service';
import UsersModule from '@schema/resolvers/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [FriendsResolver, FriendsService],
  exports: [FriendsService]
})
export class FriendsModule {}

export default FriendsModule;