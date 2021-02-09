import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import IModel from '@schema/models/model.interface';
import User from '@schema/models/users/users.model';
import Datetime from '@schema/types/datetime.type';
import { Status, Type } from '@schema/models/invitations/invitations.dto';
import UUID from '@schema/types/uuid.type';

registerEnumType(Status, { name: 'InvitationsStatus' });
registerEnumType(Type, { name: 'InvitationsType' });

@ObjectType()
export class Invitation extends IModel {
  @Field(() => User)
  public sender?: User;

  @Field(() => UUID)
  public senderId: string;

  @Field(() => User)
  public recipient?: User;

  @Field(() => UUID)
  public recipientId: string;

  @Field(() => Type)
  public type: Type;

  @Field(() => Status)
  public status: Status;

  @Field(() => Datetime)
  public expiresAt: Date;
}

export default Invitation;
