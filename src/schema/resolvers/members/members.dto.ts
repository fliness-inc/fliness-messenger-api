import { InputType, registerEnumType } from '@nestjs/graphql';
import Filter from '@schema/generics/filter';
import Members from '@database/entities/member';

export enum MemberRoleEnum {
    CREATOR = 'CREATOR',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

export enum MembersFieldArgumentEnum {
    ID = '"member"."id"',
    CHAT_ID = '"member"."chat_id"',
    USER_ID = '"member"."user_id"',
    UPDATED_AT = '"member"."updated_at"',
    CREATED_AT = '"member"."created_at"',
    ROLE_NAME = '"role"."name"',
}

registerEnumType(MembersFieldArgumentEnum, {
	name: 'MembersFieldName'
});

@InputType()
export class MembersFilter extends Filter<Members>(Members, MembersFieldArgumentEnum) {}