import {Entity, Column, OneToOne } from 'typeorm';
import { IEntity } from '@database/entities/entity';
import { User } from '@database/entities/user';

@Entity({name: 'tokens'})
export class Token extends IEntity {

    @Column({ type: 'uuid', name: 'user_id'})
    public userId: string;

    @Column()
    public token: string;

    @Column({ name:'user_agent' })
    public userAgent: string;

    @Column({ name: 'expires_at', default: () => 'NOW()' })
    public expiresAt: Date;

    @OneToOne(type => User, u => u.id)
    public user: User;
}