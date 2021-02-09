import { Field, ObjectType, Directive } from '@nestjs/graphql';
import IModel from '@schema/models/model.interface';

@ObjectType()
export class User extends IModel {
  @Field(() => String)
  public readonly name: string;

  @Field(() => String)
  public readonly email: string;

  @Directive('@publicURL(join: "img/")')
  @Field(() => String, { nullable: true })
  public readonly avatarURL?: string;
}

export default User;
