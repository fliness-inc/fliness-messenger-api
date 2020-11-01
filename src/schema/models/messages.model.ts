import { ObjectType, Field } from '@nestjs/graphql';
import Entity from '@schema/models/entity';
import DateTime from '@schema/types/datetime';
import Member from '@schema/models/members.model';
import UUID from '@schema/types/uuid';

@ObjectType()
export class Message extends Entity {
    @Field(() => String)
    public readonly text: string;

    @Field(() => UUID) 
    public readonly memberId: string;

    @Field(() => Member)
    public readonly member?: Member;

    @Field(() => DateTime)
    public readonly createdAt: Date;

    @Field(() => DateTime)
    public readonly updatedAt: Date;
}

export default Message;