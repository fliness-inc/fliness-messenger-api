import { InputType, Field } from '@nestjs/graphql';
import UUID from '@schema/types/uuid';

export enum MemberRoleEnum {
    CREATOR = 'CREATOR',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

@InputType()
export class MembersFilter {
    @Field(type => UUID, { 
        nullable: true,  
        description: 'The id of the member.' 
    })
    public readonly id: string;

    @Field(type => MemberRoleEnum, { 
        nullable: true,  
        description: 'The role of the member.' 
    })
    public readonly role: MemberRoleEnum;
}