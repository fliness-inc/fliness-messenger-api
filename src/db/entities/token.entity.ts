import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import IEntity from './entity.interface';
import UserEntity from './user.entity';

@Entity({ name: 'tokens' })
export class Token extends IEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  public userId: string;

  @Column()
  public token: string;

  @Column({ name: 'user_agent' })
  public userAgent: string;

  @Column({ name: 'expires_at', default: () => 'NOW()' })
  public expiresAt: Date;

  @OneToOne(type => UserEntity)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id'
  })
  public user: UserEntity;
}

export default Token;
