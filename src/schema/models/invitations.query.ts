import { ObjectType, Field, ResolveField, Query, Parent } from '@nestjs/graphql';
import Invitation from '@schema/models/invitations.query';

@ObjectType() 
export class InvitationQuery {

    @Field(type => [Invitation])
    public readonly fromMe: Invitation[];

    @Field(type => [Invitation])
    public readonly forMe: Invitation[];
}

export default InvitationQuery;