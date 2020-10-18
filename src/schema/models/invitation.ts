import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import Entity from '@schema/models/entity';
import User from '@schema/models/user';
import Datetime from '@schema/types/datetime';
import { Status, Type } from '@schema/resolvers/invitations/invitations.dto';
import UUID from '@schema/types/uuid';


registerEnumType(Status, { name: 'InvitationsStatus' });
registerEnumType(Type, { name: 'InvitationsType' });

@ObjectType()
export class Invitation extends Entity {

    @Field(type => User)
    public sender?: User;

    @Field(type => UUID)
    public senderId: string;

    @Field(type => User)
    public recipient?: User;

    @Field(type => UUID)
    public recipientId: string;

    @Field(type => Type)
    public type: Type;

    @Field(type => Status)
    public status: Status;

    @Field(type => Datetime)
    public expiresAt: Date;
}

export default Invitation;

