import { ObjectType, Field } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';

@ObjectType()
export class Entity {
    @Field(() => UUID)
    public readonly id: string;
}

export default Entity;