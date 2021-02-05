import { ObjectType, Field } from '@nestjs/graphql';
import User from '@schema/models/users/users.model';
import InvitationsQuery from '@schema/models/invitations/invitations.query';
import FriendsConnection from '@schema/models/friends/friends.model.pagination';

@ObjectType()
export class MeQuery extends User {
  @Field(() => InvitationsQuery)
  public readonly invitations?: InvitationsQuery;

  @Field(() => FriendsConnection)
  public readonly friends?: FriendsConnection;
}

export default MeQuery;
