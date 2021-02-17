import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import IEntity from './entity.interface';
import ChatType from './chat-type.entity';
import Member from './member.entity';

@Entity('chats')
export class Chat extends IEntity {
  @Column({ length: 255, nullable: true })
  public title: string;

  @Column({ length: 2048, nullable: true })
  public description: string;

  @Column({ name: 'member_limit', nullable: true })
  public memberLimit: number;

  @Column({ name: 'type_id', type: 'uuid' })
  public typeId: string;

  @ManyToOne(() => ChatType)
  @JoinColumn({ name: 'type_id' })
  public type: ChatType;

  @OneToMany(
    () => Member,
    member => member.chat
  )
  public members: Member[];
}

export default Chat;
