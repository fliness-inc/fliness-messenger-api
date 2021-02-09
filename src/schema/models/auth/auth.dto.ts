import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AuthSignInDTO {
  @Field(() => String)
  public readonly email: string;

  @Field(() => String)
  public readonly password: string;
}

@InputType()
export class AuthSignUpDTO {
  @Field(() => String)
  public readonly name: string;

  @Field(() => String)
  public readonly email: string;

  @Field(() => String)
  public readonly password: string;
}
