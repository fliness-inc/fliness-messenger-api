import { ObjectType, Field } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';

@ObjectType()
export class Token {
    @Field(type => String)
    public accessToken: string;

    @Field(type => UUID)
    public refreshToken: string;
}

export default Token;