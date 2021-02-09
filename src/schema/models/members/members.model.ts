import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import IModel from '@schema/models/model.interface';
import Chat from '@schema/models/chats/chats.model';
import User from '@schema/models/users/users.model';
import DateTime from '@schema/types/datetime.type';
import UUID from '@schema/types/uuid.type';
import { MemberRoleEnum } from '@schema/models/members/members.dto';

registerEnumType(MemberRoleEnum, {
  name: 'MemberRole'
});

@ObjectType()
export class Member extends IModel {
  @Field(() => UUID)
  public readonly chatId: string;

  @Field(() => Chat)
  public readonly chat?: Chat;

  @Field(() => UUID)
  public readonly userId: string;

  @Field(() => User)
  public readonly user?: User;

  @Field(() => MemberRoleEnum)
  public readonly role: MemberRoleEnum;

  @Field(() => DateTime)
  public readonly createdAt: Date;

  @Field(() => DateTime)
  public readonly updatedAt: Date;
}

export default Member;
