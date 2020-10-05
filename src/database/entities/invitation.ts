import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import IEntity from './entity';
import User from './user';
import InvitationType from './invitation-type';
import InvitationStatus from './invitation-status';

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

    @ManyToOne(type => User)
    @JoinColumn({ name: 'sender_id' })
    public sender: User;

    @ManyToOne( type => User)
    @JoinColumn({ name: 'recipient_id' })
    public recipient: User;

    @ManyToOne( type => InvitationType)
    @JoinColumn({ name: 'type_id' })
    public type: InvitationType;

    @ManyToOne( type => InvitationStatus)
    @JoinColumn({ name: 'status_id' })
    public status: InvitationStatus;
} 

export default Invitation;