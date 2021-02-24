import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { IEntity } from './entity.interface';
import { UserEntity } from './user.entity';
import { ChatEntity } from './chat.entity';
import { MemberRoleEntity } from './member-role.entity';

@Entity('members')
export class MemberEntity extends IEntity {
  @Column({ name: 'chat_id', type: 'uuid' })
  public chatId: string;

  @ManyToOne(() => ChatEntity)
  @JoinColumn({ name: 'chat_id' })
  public chat: ChatEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  public userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @Column({ name: 'role_id', type: 'uuid' })
  public roleId: string;

  @ManyToOne(() => MemberRoleEntity)
  @JoinColumn({ name: 'role_id' })
  public role: MemberRoleEntity;
}

export default MemberEntity;
