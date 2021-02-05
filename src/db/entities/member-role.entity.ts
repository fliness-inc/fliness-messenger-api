import { Entity, Column } from 'typeorm';
import IEntity from './entity.interface';

@Entity({ name: 'member_roles' })
export class MemberRole extends IEntity {
  @Column({ length: 255, unique: true })
  public name: string;

  @Column({ type: 'float', unique: true })
  public weight: number;
}

export default MemberRole;
