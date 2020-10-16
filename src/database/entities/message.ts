import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import IEntity from './entity';
import Member from './member';

@Entity({ name: 'messages' })
export class Message extends IEntity {
    
    @Column({ length: 4096 })
    public text: string;

    @Column({ name: 'member_id', type: 'uuid' })
    public memberId: string;

    @OneToOne(type => Member)
    @JoinColumn({ name: 'member_id' })
    public member: Member;
}

export default Message;