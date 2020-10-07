export enum MemberRoleNameEnum {
    CREATOR = 'CREATOR',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

export class MemberResponse {
    public readonly id: string;
    public readonly userId: string;
    public readonly chatId: string;
    public readonly role: string;
    public readonly createdAt: Date; 
}