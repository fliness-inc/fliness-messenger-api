import { ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import Member from '@schema/models/members.model';
import { Connection } from '@schema/generics/pagination';
import PaginationInput from '@schema/input/pagination';

export enum MemberPaginationField {
    ID = 'member.id',
    ROLE = 'member.role',
    UPDATED_AT = 'member.updatedAt',
    CREATED_AT = 'member.createdAt'
}

registerEnumType(MemberPaginationField, {
    name: 'MemberPaginationField'
});

@InputType()
export class MemberPaginationInput extends PaginationInput(MemberPaginationField) {}

@ObjectType()
export class MemberConnection extends Connection(Member) {}

export default MemberConnection;