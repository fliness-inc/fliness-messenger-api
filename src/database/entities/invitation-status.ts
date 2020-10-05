import { Column, Entity } from 'typeorm';
import IEntity from './entity';

@Entity({ name: 'invitation_statuses' })
export class InvitationStatus extends IEntity {
    @Column({ length: 255, unique: true })
    public name: string;
}

export default InvitationStatus;