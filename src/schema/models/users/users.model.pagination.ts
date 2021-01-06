import {ObjectType, InputType, registerEnumType} from '@nestjs/graphql';
import User from '@schema/models/users/users.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';
import * as Pagination from '@src/pagination/paginator';

export const UserPaginationField = Pagination.makeEnum({
    ID: Pagination.makeEnumField('user', 'id'),
    NAME: Pagination.makeEnumField('user', 'name'),
    EMAIL: Pagination.makeEnumField('user', 'email'),
});

registerEnumType(UserPaginationField, { name: 'UserPaginationField' });

@InputType()
export class UserPaginationInput extends PaginationInput(UserPaginationField) {}

@ObjectType()
export class UserConnection extends Connection(User) {}

export default UserConnection;