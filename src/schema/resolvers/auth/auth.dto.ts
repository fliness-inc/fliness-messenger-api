import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AuthLoginDTO {
    @Field(type => String)
    public readonly email: string;

    @Field(type => String)
    public readonly password: string;
}

@InputType()
export class AuthRegisterDTO {
    @Field(type => String)
    public readonly name: string;

    @Field(type => String)
    public readonly email: string;

    @Field(type => String)
    public readonly password: string;
}