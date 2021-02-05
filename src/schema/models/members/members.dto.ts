import { InputType, registerEnumType } from '@nestjs/graphql';
import { makeFilter, makeEnum, makeEnumField } from '@lib/filter/filter';
import Members from '@db/entities/member.entity';

export enum MemberRoleEnum {
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export const MembersFieldArgumentEnum = makeEnum({
  ID: makeEnumField('members', 'id'),
  CHAT_ID: makeEnumField('members', 'chat_id'),
  USER_ID: makeEnumField('members', 'user_id'),
  UPDATED_AT: makeEnumField('members', 'updated_at'),
  CREATED_AT: makeEnumField('members', 'created_at'),
  ROLE_NAME: makeEnumField('role', 'name')
});

registerEnumType(MembersFieldArgumentEnum, {
  name: 'MembersFieldName'
});

@InputType()
export class MembersFilter extends makeFilter<Members>(
  Members,
  MembersFieldArgumentEnum
) {}
