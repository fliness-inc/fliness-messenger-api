import { ObjectType, Field } from '@nestjs/graphql';
import IModel from '@schema/models/model.interface';
import DateTime from '@schema/types/datetime.type';
import Member from '@schema/models/members/members.model';
import UUID from '@schema/types/uuid.type';

@ObjectType()
export class Message extends IModel {
  @Field(() => String)
  public readonly text: string;

  @Field(() => UUID)
  public readonly memberId: string;

  @Field(() => Member)
  public readonly member?: Member;

  @Field(() => DateTime)
  public readonly createdAt: Date;

  @Field(() => DateTime)
  public readonly updatedAt: Date;
}

export default Message;
