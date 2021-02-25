export enum ChatTypeEnum {
  DIALOG = 'DIALOG',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
}

export interface ChatCreateDTO {
  type: ChatTypeEnum;
  userIds: string[];
}
