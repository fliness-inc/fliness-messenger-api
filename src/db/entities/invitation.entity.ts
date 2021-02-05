import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import IEntity from './entity.interface';
import User from './user.entity';
import InvitationType from './invitation-type.entity';
import InvitationStatus from './invitation-status.entity';

@Entity({ name: 'invitations' })
export class Invitation extends IEntity {
  @Column({ name: 'sender_id', type: 'uuid' })
  public senderId: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  public recipientId: string;

  @Column({ name: 'type_id', type: 'uuid' })
  public typeId: string;

  @Column({ name: 'status_id', type: 'uuid' })
  public statusId: string;

  @Column({ name: 'expires_at', default: () => 'NOW()' })
  public expiresAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  public sender: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  public recipient: User;

  @ManyToOne(() => InvitationType)
  @JoinColumn({ name: 'type_id' })
  public type: InvitationType;

  @ManyToOne(() => InvitationStatus)
  @JoinColumn({ name: 'status_id' })
  public status: InvitationStatus;
}

export default Invitation;
