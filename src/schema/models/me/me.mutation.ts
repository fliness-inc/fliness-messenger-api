import { ObjectType, Field } from '@nestjs/graphql';
import InvitationsMutation from '@schema/models/invitations/invitations.mutation';
import ChatMutation from '@schema/models/chats/chats.mutation';
import IModel from '@schema/models/model.interface';

@ObjectType()
export class MeMutation extends IModel {
  @Field()
  public readonly invitations?: InvitationsMutation;

  @Field()
  public readonly chats?: ChatMutation;
}

export default MeMutation;
