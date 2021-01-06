import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Member from '@schema/models/members/members.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';
import * as Pagination from '@src/pagination/paginator';

export const MemberPaginationField = Pagination.makeEnum({
    ID: Pagination.makeEnumField('member', 'id'),
    ROLE: Pagination.makeEnumField('member', 'role'),
    UPDATED_AT: Pagination.makeEnumField('member', 'updated_at'),
    CREATED_AT: Pagination.makeEnumField('member', 'created_at'),
});

registerEnumType(MemberPaginationField, {
	name: 'MemberPaginationField'
});

@InputType()
export class MemberPaginationInput extends PaginationInput(MemberPaginationField) {}

@ObjectType()
export class MemberConnection extends Connection(Member) {}

export default MemberConnection;