import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import Entity from '@schema/models/entity';
import Chat from '@schema/models/chats.model';
import User from '@schema/models/user';
import DateTime from '@schema/types/datetime';
import UUID from '@schema/types/uuid';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';

registerEnumType(MemberRoleEnum, {
    name: 'MemberRole'
});

@ObjectType()
export class Member extends Entity {

    @Field(type => UUID)
    public readonly chatId: string;
    
    @Field(type => Chat)
    public readonly chat?: Chat;

    @Field(type => UUID)
    public readonly userId: string;
    
    @Field(type => User)
    public readonly user?: User;

    @Field(type => MemberRoleEnum)
    public readonly role: MemberRoleEnum;

    @Field(type => DateTime)
    public readonly createdAt: Date;

    @Field(type => DateTime)
    public readonly updatedAt: Date;
}

export default Chat;