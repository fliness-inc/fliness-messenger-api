import { Field, ObjectType, Directive } from '@nestjs/graphql';
import IEntity from '@schema/models/entity.interface';

@ObjectType()
export class User extends IEntity {
  @Field(() => String)
  public readonly name: string;

  @Field(() => String)
  public readonly email: string;

  @Directive('@publicURL(join: "img/")')
  @Field(() => String, { nullable: true })
  public readonly avatarURL?: string;
}

export default User;
