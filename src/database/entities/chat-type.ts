import { Entity, Column } from 'typeorm';
import IEntity from './entity';

@Entity({ name: 'chat_types' })
export class ChatType extends IEntity {
    @Column({ length: 255, unique: true })
    public name: string;
}

export default ChatType;