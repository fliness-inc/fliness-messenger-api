
export enum Privilege {
    CREATOR = 'CREATOR',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

export class MemberRespomse {
    public readonly id: string;
    public readonly userId: string;
    public readonly chatId: string;
    public readonly privilege: string;
    public readonly createdAt: Date; 
}