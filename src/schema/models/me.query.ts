import { ObjectType, Field } from '@nestjs/graphql';
import User from '@schema/models/users.model';
import InvitationsQuery from '@schema/models/invitations.query';
import UsersConnection from '@schema/models/users.pagination';

@ObjectType()
export class MeQuery extends User {
    @Field(() => InvitationsQuery)
    public readonly invitations?: InvitationsQuery;

    @Field(() => UsersConnection)
    public readonly friends?: UsersConnection;
}

export default MeQuery;