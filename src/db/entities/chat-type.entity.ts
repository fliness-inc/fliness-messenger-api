import { Entity, Column } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity({ name: 'chat_types' })
export class ChatTypeEntity extends IEntity {
  @Column({ length: 255, unique: true })
  public name: string;
}

export default ChatTypeEntity;
