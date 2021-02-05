import { Entity, Column, OneToOne } from 'typeorm';
import IEntity from './entity.interface';
import User from './user.entity';

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

  @OneToOne(
    () => User,
    u => u.id
  )
  public user: User;
}

export default Token;
