import {ObjectType, InputType, registerEnumType} from '@nestjs/graphql';
import Friend from '@schema/models/friends/friends.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';
import Pagination from '@src/pagination/pagination';

export const FriendPaginationField = Pagination.makeEnum({
    ID: Pagination.makeEnumField('friend', 'id'),
    NAME: Pagination.makeEnumField('friend', 'name'),
    EMAIL: Pagination.makeEnumField('friend', 'email'),
});

registerEnumType(FriendPaginationField, {
	name: 'FriendPaginationField'
});

@InputType()
export class FriendPaginationInput extends PaginationInput(FriendPaginationField) {}

@ObjectType()
export class FriendConnection extends Connection(Friend) {}

export default FriendConnection;