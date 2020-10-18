import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import Entity from '@schema/models/entity';
import DateTime from '@schema/types/datetime';
import Member from '@schema/models/members.model';
import UUID from '@schema/types/uuid';

@ObjectType()
export class Message extends Entity {
    @Field(type => String)
    public readonly text: string;

    @Field(type => UUID) 
    public readonly memberId: string;

    @Field(type => Member)
    public readonly member?: Member;

    @Field(type => DateTime)
    public readonly createdAt: Date;

    @Field(type => DateTime)
    public readonly updatedAt: Date;
}

export default Message;