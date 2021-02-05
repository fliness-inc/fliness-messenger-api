import { ObjectType, Field } from '@nestjs/graphql';
import Invitation from '@schema/models/invitations/invitations.query';

@ObjectType()
export class InvitationQuery {
  @Field(() => [Invitation])
  public readonly fromMe: Invitation[];

  @Field(() => [Invitation])
  public readonly forMe: Invitation[];
}

export default InvitationQuery;
