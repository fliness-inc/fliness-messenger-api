import { InputType, registerEnumType } from '@nestjs/graphql';
import { makeFilter, makeEnum, makeEnumField } from '@lib/filter/filter';
import FriendEntity from '@db/entities/friend.entity';

export const FriendsFieldArgumentEnum = makeEnum({
  ID: makeEnumField('friend', 'id'),
  NAME: makeEnumField('friend', 'name'),
  EMAIL: makeEnumField('friend', 'email')
});

registerEnumType(FriendsFieldArgumentEnum, {
  name: 'FriendsFieldName'
});

@InputType()
export class FriendsFilter extends makeFilter<FriendEntity>(
  FriendEntity,
  FriendsFieldArgumentEnum
) {}
