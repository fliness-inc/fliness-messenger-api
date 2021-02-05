import { Module } from '@nestjs/common';
import FriendsResolver from '@schema/models/friends/friends.query.resolver';
import FriendsService from '@schema/models/friends/friends.service';
import UsersModule from '@schema/models/users/users.module';
import FriendEntity from '@db/entities/friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([FriendEntity])],
  providers: [FriendsResolver, FriendsService],
  exports: [FriendsService]
})
export class FriendsModule {}

export default FriendsModule;
