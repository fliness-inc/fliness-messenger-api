import Member from '@db/entities/member.entity';
import Factory from '@db/seeds/factory';
import Seeder from '@db/seeds/seeder';

export class MemberFactory implements Factory<Member> {
  public create({ chatId, userId, roleId }: Partial<Member> = {}) {
    const member = new Member();
    member.chatId = chatId;
    member.userId = userId;
    member.roleId = roleId;
    return member;
  }
}

export class MemberSeeder extends Seeder<Member>(Member) {
  public constructor(factory: MemberFactory) {
    super(factory);
  }
}

export default MemberSeeder;
