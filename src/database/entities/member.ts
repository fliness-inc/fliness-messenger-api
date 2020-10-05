import { Column, Entity, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import IEntity from './entity';
import User from './user';
import Chat from './chat';
import MemberPrivilege from './member-privilege';

@Entity({ name: 'members' })
export class Member extends IEntity {

    @Column({ name: 'chat_id', type: 'uuid' })
    public chatId: string;

    @ManyToOne(type => Chat)
    @JoinColumn({ name: 'chat_id' })
    public chat: Chat;

    @Column({ name: 'user_id', type: 'uuid' })
    public userId: string;

    @ManyToOne(type => User)
    @JoinColumn({ name: 'user_id' })
    public user: User;

    @Column({ name: 'privilege_id', type: 'uuid' })
    public privilegeId: string;

    @ManyToOne(type => MemberPrivilege)
    @JoinColumn({ name: 'privilege_id' })
    public privilege: MemberPrivilege;
}

export default Member;