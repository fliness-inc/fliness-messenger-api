import { ObjectType, Field } from '@nestjs/graphql';
import Token from '@schema/models/token';

@ObjectType()
export class Auth {
    @Field()
    public readonly login: Token;

    @Field()
    public readonly register: Token;

    @Field()
    public readonly refresh: Token;

    @Field()
    public readonly logout: Boolean;
}

export default Auth;