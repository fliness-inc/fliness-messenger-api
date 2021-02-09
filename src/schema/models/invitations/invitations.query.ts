import { ObjectType, Field } from '@nestjs/graphql';
import Invitation from './invitations.query';
import IModel from '@schema/models/model.interface';

@ObjectType()
export class InvitationQuery extends IModel {
  @Field(() => [Invitation])
  public readonly fromMe: Invitation[];

  @Field(() => [Invitation])
  public readonly forMe: Invitation[];
}

export default InvitationQuery;
