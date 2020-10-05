import { Entity, Column } from 'typeorm';
import IEntity from '@database/entities/entity';

@Entity({ name: 'member_privilieges' })
export class MemberPriviliege extends IEntity {
    @Column({ length: 255, unique: true })
    public name: string;
}

export default MemberPriviliege;