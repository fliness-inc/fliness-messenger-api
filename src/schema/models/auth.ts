import { ObjectType, Field } from '@nestjs/graphql';
import Token from '@schema/models/token';

@ObjectType()
export class Auth {
    @Field(type => Token)
    public readonly login: Token;

    @Field(type => Token)
    public readonly register: Token;

    @Field(type => Token)
    public readonly refresh: Token;

    @Field(type => Boolean)
    public readonly logout: Boolean;
}

export default Auth;