import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Friend from '@schema/models/friends/friends.model';
import {
  makeDTO,
  makeEnum,
  makeConnection,
  makeEnumField
} from '@lib/pagination/pagination';

export const FriendPaginationField = makeEnum({
  ID: makeEnumField('friend', 'id'),
  NAME: makeEnumField('friend', 'name'),
  EMAIL: makeEnumField('friend', 'email')
});

registerEnumType(FriendPaginationField, {
  name: 'FriendPaginationField'
});

@InputType()
export class FriendPaginationInput extends makeDTO(FriendPaginationField) {}

@ObjectType()
export class FriendConnection extends makeConnection(Friend) {}

export default FriendConnection;
