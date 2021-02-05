import { ObjectType, Field } from '@nestjs/graphql';
import Invitation from '@schema/models/invitations/invitation.model';

@ObjectType()
export class InvitationsMutaion {
  @Field(() => Invitation)
  public readonly create: Invitation;

  @Field(() => Invitation)
  public readonly accept: Invitation;

  @Field(() => Invitation)
  public readonly reject: Invitation;
}

export default InvitationsMutaion;
