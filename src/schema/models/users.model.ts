import {Field, ObjectType } from '@nestjs/graphql';
import Entity from '@schema/models/entity';

@ObjectType()
export class User extends Entity {
    @Field(type => String)
    public readonly name: string;

    @Field(type => String)
    public readonly email: string;

    @Field(type => String, { nullable: true })
    public readonly avatar?: string;
}

export default User;
