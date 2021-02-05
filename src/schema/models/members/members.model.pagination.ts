import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Member from '@schema/models/members/members.model';
import {
  makeEnumField,
  makeEnum,
  makeDTO,
  makeConnection
} from '@lib/pagination/pagination';

export const MemberPaginationField = makeEnum({
  ID: makeEnumField('members', 'id'),
  ROLE: makeEnumField('role', 'name'),
  UPDATED_AT: makeEnumField('members', 'updated_at'),
  CREATED_AT: makeEnumField('members', 'created_at')
});

registerEnumType(MemberPaginationField, {
  name: 'MemberPaginationField'
});

@InputType()
export class MemberPaginationInput extends makeDTO(MemberPaginationField) {}

@ObjectType()
export class MemberConnection extends makeConnection(Member) {}

export default MemberConnection;
