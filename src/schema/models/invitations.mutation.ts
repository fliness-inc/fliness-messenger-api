import { ObjectType, Field, ResolveField, Query, Parent } from '@nestjs/graphql';
import Invitation from '@schema/models/invitation';

@ObjectType() 
export class InvitationsMutaion {

    @Field(type => Invitation)
    public readonly create: Invitation;

    @Field(type => Invitation)
    public readonly accept: Invitation;

    @Field(type => Invitation)
    public readonly reject: Invitation;
}

export default InvitationsMutaion;