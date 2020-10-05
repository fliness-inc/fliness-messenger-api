import { Column, Entity } from 'typeorm';
import IEntity from './entity';

@Entity({ name: 'invitation_types' })
export class InvitationType extends IEntity {
    @Column({ length: 255, unique: true })
    public name: string;
}

export default InvitationType;