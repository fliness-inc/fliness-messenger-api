import { ObjectType, Field } from '@nestjs/graphql';
import InvitationsMutation from '@schema/models/invitations.mutation';

@ObjectType()
export class MeMutation {
    @Field()
    public readonly invitations?: InvitationsMutation;
}

export default MeMutation;