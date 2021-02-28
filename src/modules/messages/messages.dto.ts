export class MessageCreateDTO {
  public readonly text: string;
}

export enum EVENTS {
  MESSAGE_CREATED_EVETN = 'message-created',
}
