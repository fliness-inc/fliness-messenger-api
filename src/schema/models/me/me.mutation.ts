import { ObjectType, Field } from '@nestjs/graphql';
import InvitationsMutation from '@schema/models/invitations/invitations.mutation';
import ChatMutation from '@schema/models/chats/chats.mutation';

@ObjectType()
export class MeMutation {
    @Field()
    public readonly invitations?: InvitationsMutation;

    @Field()
    public readonly chats?: ChatMutation;
}

export default MeMutation;