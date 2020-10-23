import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import IEntity from './entity';
import ChatType from './chat-type';
import Member from './member';

@Entity({ name: 'chats' })
export class Chat extends IEntity {
    
    @Column({ length: 255, nullable: true })
    public title: string;

    @Column({ length: 2048, nullable: true })
    public description: string;

    @Column({ name: 'member_limit', nullable: true })
    public memberLimit: number;

    @Column({ name: 'type_id', type: 'uuid' })
    public typeId: string;

    @ManyToOne(type => ChatType)
    @JoinColumn({ name: 'type_id' })
    public type: ChatType;

    @OneToMany(type => Member, member => member.chat)
    public members: Member[];
}

export default Chat;