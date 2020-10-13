import {Field, ObjectType} from '@nestjs/graphql';
import Entity from '@schema/models/entity';

@ObjectType('User')
export class User extends Entity {
    @Field(type => String)
    public readonly name: string;

    @Field(type => String)
    public readonly email: string;
}

export default User;
