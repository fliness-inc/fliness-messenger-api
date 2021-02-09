import { ObjectType, Field } from '@nestjs/graphql';
import Token from '@schema/models/tokens/tokens.model';
import IModel from '@schema/models/model.interface';

@ObjectType()
export class Auth extends IModel {
  @Field(() => Token)
  public readonly signIn: Token;

  @Field(() => Token)
  public readonly signUp: Token;

  @Field(() => Token)
  public readonly refresh: Token;

  @Field(() => Boolean)
  public readonly signOut: boolean;
}

export default Auth;
