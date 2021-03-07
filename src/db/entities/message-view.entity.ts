import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import { MemberEntity } from './member.entity';
import { MessageEntity } from './message.entity';

@Entity('message_views')
export class MessageViewEntity extends IEntity {
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

export default MessageViewEntity;
