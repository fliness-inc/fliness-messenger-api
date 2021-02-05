import { InputType, Field } from '@nestjs/graphql';
import UUID from '@schema/types/uuid.type';

export enum Status {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WAITING = 'WAITING'
}

export enum Type {
  INVITE_TO_FRIENDS = 'INVITE_TO_FRIENDS',
  INVITE_TO_GROUP = 'INVITE_TO_GROUP',
  INVITE_TO_CHANNEL = 'INVITE_TO_CHANNEL'
}

@InputType()
export class CreateInvitationDTO {
  @Field(() => UUID)
  public readonly userId: string;

  @Field(() => Type)
  public readonly type: Type;
}
