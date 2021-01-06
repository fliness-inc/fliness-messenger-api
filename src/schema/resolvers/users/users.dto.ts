import { InputType, registerEnumType } from '@nestjs/graphql';
import Filter from '@schema/generics/filter';
import User from '@database/entities/user';

export enum UsersFieldArgumentEnum {
    ID = 'user.id',
    NAME = 'user.name',
    EMAIL = 'user.email',
}

registerEnumType(UsersFieldArgumentEnum, {
	name: 'UsersFieldName'
});

@InputType()
export class UsersFilter extends Filter<User>(User, UsersFieldArgumentEnum) {}