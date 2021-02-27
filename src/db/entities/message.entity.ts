import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { IEntity } from './entity.interface';
import { MemberEntity } from './member.entity';

@Entity('messages')
export class MessageEntity extends IEntity {
  @Column({ length: 4096 })
  public text: string;

  @Column({ name: 'member_id', type: 'uuid' })
  public memberId: string;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'member_id' })
  public member: MemberEntity;
}

export default MessageEntity;
