import { ObjectType, Field } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';

@ObjectType('Entity')
export class Entity {
    @Field(type => UUID)
    public readonly id: string;
}

export default Entity;