import {ObjectType, InputType, registerEnumType} from '@nestjs/graphql';
import User from '@schema/models/users.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';

export enum UserPaginationField {
    ID = 'friend.id',
    NAME = 'friend.name',
    EMAIL = 'friend.email'
}

registerEnumType(UserPaginationField, {
	name: 'UserPaginationField'
});

@InputType()
export class UserPaginationInput extends PaginationInput(UserPaginationField) {}

@ObjectType()
export class UserConnection extends Connection(User) {}

export default UserConnection;