import { ObjectType, Field } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';

@ObjectType()
export class Token {
    @Field(() => String)
    public accessToken: string;

    @Field(() => UUID)
    public refreshToken: string;
}

export default Token;