import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import User from '@schema/models/users/users.model';
import {
  makeEnum,
  makeEnumField,
  makeDTO,
  makeConnection
} from '@lib/pagination/pagination';

export const UserPaginationField = makeEnum({
  ID: makeEnumField('users', 'id'),
  NAME: makeEnumField('users', 'name'),
  EMAIL: makeEnumField('users', 'email')
});

registerEnumType(UserPaginationField, { name: 'UserPaginationField' });

@InputType()
export class UserPaginationInput extends makeDTO(UserPaginationField) {}

@ObjectType()
export class UserConnection extends makeConnection(User) {}

export default UserConnection;
