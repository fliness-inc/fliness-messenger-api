import Friend from '@db/entities/friend.entity';
import Factory from './factory';
import Seeder from './seeder';

export class FriendFactory implements Factory<Friend> {
  public create({ userId, friendId }: Partial<Friend> = {}) {
    const friend = new Friend();
    friend.userId = userId;
    friend.friendId = friendId;
    return friend;
  }
}

export class FriendSeeder extends Seeder<Friend>(Friend) {
  public constructor(factory: FriendFactory) {
    super(factory);
  }
}

export default FriendSeeder;
