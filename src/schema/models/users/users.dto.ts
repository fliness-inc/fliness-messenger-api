import { InputType, registerEnumType } from '@nestjs/graphql';
import { makeFilter, makeEnum, makeEnumField } from '@lib/filter/filter';
import User from '@db/entities/user.entity';

export const UsersFieldArgumentEnum = makeEnum({
  ID: makeEnumField('users', 'id'),
  NAME: makeEnumField('users', 'name'),
  EMAIL: makeEnumField('users', 'email')
});

registerEnumType(UsersFieldArgumentEnum, {
  name: 'UsersFieldName'
});

@InputType()
export class UsersFilter extends makeFilter<User>(
  User,
  UsersFieldArgumentEnum
) {}
