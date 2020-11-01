import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity';
import { User } from './user';

@Entity({ name: 'friends' })
export class Friend extends IEntity {
    
    @Column({ name: 'user_id', type: 'uuid' })
    public userId: string;

    @Column({ name: 'friend_id', type: 'uuid' })
    public friendId: string;

    @ManyToOne(() => User, u => u.id)
    @JoinColumn({ name: 'user_id' })
    public user: User;

    @ManyToOne(() => User, u => u.id)
    @JoinColumn({ name: 'friend_id' })
    public friend: User;
}

export default Friend;
