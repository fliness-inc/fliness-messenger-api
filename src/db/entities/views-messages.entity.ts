import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { IEntity } from './entity.interface';
import { Member as MemberEntity } from './member.entity';
import { Message as MessageEntity } from './message.entity';

@Entity('views_messages')
export class ViewMessage extends IEntity {
  @Column({ name: 'member_id', type: 'uuid' })
  public memberId: string;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'member_id' })
  public member: MemberEntity;

  @Column({ name: 'message_id', type: 'uuid' })
  public messageId: string;

  @ManyToOne(() => MessageEntity)
  @JoinColumn({ name: 'message_id' })
  public message: MessageEntity;
}

export default ViewMessage;
