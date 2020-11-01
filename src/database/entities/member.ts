import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import IEntity from '@database/entities/entity';
import User from '@database/entities/user';
import Chat from '@database/entities/chat';
import MemberRole from '@database/entities/member-role';

@Entity({ name: 'members' })
export class Member extends IEntity {

    @Column({ name: 'chat_id', type: 'uuid' })
    public chatId: string;

    @ManyToOne(() => Chat)
    @JoinColumn({ name: 'chat_id' })
    public chat: Chat;

    @Column({ name: 'user_id', type: 'uuid' })
    public userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    public user: User;

    @Column({ name: 'role_id', type: 'uuid' })
    public roleId: string;

    @ManyToOne(() => MemberRole)
    @JoinColumn({ name: 'role_id' })
    public role: MemberRole;
}

export default Member;