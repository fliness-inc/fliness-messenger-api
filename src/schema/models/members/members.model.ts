import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import Entity from '@schema/models/entity.interface';
import Chat from '@schema/models/chats/chats.model';
import User from '@schema/models/users/users.model';
import DateTime from '@schema/types/datetime';
import UUID from '@schema/types/uuid';
import { MemberRoleEnum } from '@schema/resolvers/members/members.dto';

registerEnumType(MemberRoleEnum, {
	name: 'MemberRole'
});

@ObjectType()
export class Member extends Entity {

    @Field(() => UUID)
    public readonly chatId: string;
    
    @Field(() => Chat)
    public readonly chat?: Chat;

    @Field(() => UUID)
    public readonly userId: string;
    
    @Field(() => User)
    public readonly user?: User;

    @Field(() => MemberRoleEnum)
    public readonly role: MemberRoleEnum;

    @Field(() => DateTime)
    public readonly createdAt: Date;

    @Field(() => DateTime)
    public readonly updatedAt: Date;
}

export default Member;