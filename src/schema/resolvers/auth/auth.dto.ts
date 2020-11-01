import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AuthLoginDTO {
    @Field(() => String)
    public readonly email: string;

    @Field(() => String)
    public readonly password: string;
}

@InputType()
export class AuthRegisterDTO {
    @Field(() => String)
    public readonly name: string;

    @Field(() => String)
    public readonly email: string;

    @Field(() => String)
    public readonly password: string;
}