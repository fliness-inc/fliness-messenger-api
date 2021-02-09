import { ObjectType, Field } from '@nestjs/graphql';
import Invitation from './invitation.model';
import IModel from '@schema/models/model.interface';

@ObjectType()
export class InvitationsMutaion extends IModel {
  @Field(() => Invitation)
  public readonly create: Invitation;

  @Field(() => Invitation)
  public readonly accept: Invitation;

  @Field(() => Invitation)
  public readonly reject: Invitation;
}

export default InvitationsMutaion;
