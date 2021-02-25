import { Entity, Column } from 'typeorm';
import { IEntity } from './entity.interface';
import { Exclude } from 'class-transformer';

@Entity({ name: 'member_roles' })
export class MemberRoleEntity extends IEntity {
  @Column({ length: 255, unique: true })
  public name: string;

  @Exclude()
  @Column({ type: 'float', unique: true })
  public weight: number;
}

export default MemberRoleEntity;
