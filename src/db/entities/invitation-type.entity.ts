import { Column, Entity } from 'typeorm';
import IEntity from './entity.interface';

@Entity({ name: 'invitation_types' })
export class InvitationType extends IEntity {
  @Column({ length: 255, unique: true })
  public name: string;
}

export default InvitationType;
