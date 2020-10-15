import { ObjectType, Field } from '@nestjs/graphql';
import User from '@schema/models/user';
import InvitationsQuery from '@schema/models/invitations.query';

@ObjectType('Me')
export class MeQuery extends User {
    @Field()
    public readonly invitations?: InvitationsQuery;
}

export default MeQuery;