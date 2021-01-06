import { Field, ObjectType } from '@nestjs/graphql';
import Entity from '@schema/models/entity.interface';

@ObjectType()
export class Users extends Entity {
    @Field(() => String)
    public readonly name: string;

    @Field(() => String)
    public readonly email: string;

    @Field(() => String, { nullable: true })
    public readonly avatar?: string;
}

export default Users;