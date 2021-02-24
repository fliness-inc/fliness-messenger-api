import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { IEntity } from './entity.interface';
import { ChatTypeEntity } from './chat-type.entity';
import { MemberEntity } from './member.entity';

@Entity('chats')
export class ChatEntity extends IEntity {
  @Column({ length: 255, nullable: true })
  public title: string;

  @Column({ length: 2048, nullable: true })
  public description: string;

  @Column({ name: 'member_limit', nullable: true })
  public memberLimit: number;

  @Column({ name: 'type_id', type: 'uuid' })
  public typeId: string;

  @ManyToOne(() => ChatTypeEntity)
  @JoinColumn({ name: 'type_id' })
  public type: ChatTypeEntity;

  @OneToMany(() => MemberEntity, member => member.chat)
  public members: MemberEntity[];
}

export default ChatEntity;
