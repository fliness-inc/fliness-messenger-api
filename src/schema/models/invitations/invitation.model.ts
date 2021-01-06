import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import Entity from '@schema/models/entity.interface';
import User from '@schema/models/users/users.model';
import Datetime from '@schema/types/datetime';
import { Status, Type } from '@schema/resolvers/invitations/invitations.dto';
import UUID from '@schema/types/uuid';

registerEnumType(Status, { name: 'InvitationsStatus' });
registerEnumType(Type, { name: 'InvitationsType' });

@ObjectType()
export class Invitation extends Entity {

    @Field(() => User)
    public sender?: User;

    @Field(() => UUID)
    public senderId: string;

    @Field(() => User)
    public recipient?: User;

    @Field(() => UUID)
    public recipientId: string;

    @Field(() => Type)
    public type: Type;

    @Field(() => Status)
    public status: Status;

    @Field(() => Datetime)
    public expiresAt: Date;
}

export default Invitation;

