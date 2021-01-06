import { ObjectType, Field } from '@nestjs/graphql';
import Token from '@schema/models/tokens/tokens.model';

@ObjectType()
export class Auth {
    @Field(() => Token)
    public readonly login: Token;

    @Field(() => Token)
    public readonly register: Token;

    @Field(() => Token)
    public readonly refresh: Token;

    @Field(() => Boolean)
    public readonly logout: boolean;
}

export default Auth;