import { Injectable, Inject, forwardRef } from '@nestjs/common';
import UsersService from '@schema/models/users/users.service';
import ChatsService from '@schema/models/chats/chats.service';
import MemberEntity from '@db/entities/member.entity';
import {
  InvalidPropertyError,
  NotFoundError,
  OperationInvalidError
} from '@src/errors';
import MemberRole from '@db/entities/member-role.entity';
import { MemberRoleEnum } from '@/src/schema/models/members/members.dto';
import { FindManyOptions, FindOneOptions, getRepository } from 'typeorm';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@schema/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MembersService {
  public constructor(
    @InjectRepository(MemberEntity)
    private readonly membersRespository: Repository<MemberEntity>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService
  ) {}

  public async create(
    userId: string,
    chatId: string,
    roleName: MemberRoleEnum
  ): Promise<MemberEntity> {
    const user = await this.usersService.findOne({
      where: { id: userId, isDeleted: false }
    });

    if (!user)
      throw new InvalidPropertyError(
        `The user was not found with the id: ${userId}`
      );

    const chat = await this.chatsService.findOne({
      where: { id: chatId, isDeleted: false }
    });

    if (!chat)
      throw new NotFoundError(`The chat was not found with the id: ${chatId}`);

    const countMember = await getRepository(MemberEntity).count({
      where: {
        chatId: chat.id,
        isDeleted: false
      }
    });

    if (chat.memberLimit && countMember >= chat.memberLimit)
      throw new OperationInvalidError(
        `The chat already has maximum number of members`
      );

    const memberRole = await getRepository(MemberRole).findOne({
      where: { name: roleName, isDeleted: false }
    });

    if (!memberRole)
      throw new InvalidPropertyError(
        `The member role was not found: ${roleName}`
      );

    const newMember = this.membersRespository.create({
      userId: user.id,
      chatId: chat.id,
      role: memberRole
    });

    return this.membersRespository.save(newMember, { reload: true });
  }

  public async remove(userId: string, chatId: string): Promise<MemberEntity> {
    const user = await this.usersService.findOne({
      where: { id: userId, isDeleted: false }
    });

    if (!user)
      throw new InvalidPropertyError(
        `The user was not found with the id: ${userId}`
      );

    const chat = await this.chatsService.findOne({
      where: { id: chatId, isDeleted: false }
    });

    if (!chat)
      throw new NotFoundError(`The chat was not found with the id: ${chatId}`);

    const member = await this.membersRespository.findOne({
      where: { userId, chatId, isDeleted: false }
    });

    if (!member) throw new InvalidPropertyError(`The member was not found`);

    return this.membersRespository.save(
      this.membersRespository.create({
        ...member,
        isDeleted: true
      })
    );
  }

  private prepareQuery(
    alias: string,
    options: FindManyOptions<MemberEntity> = {}
  ): FindManyOptions<MemberEntity> {
    const { join = { leftJoinAndSelect: {} }, select = [] } = options;
    return {
      ...options,
      select: [
        ...select,
        'id',
        'userId',
        'chatId',
        'role',
        'updatedAt',
        'createdAt'
      ],
      join: {
        ...join,
        alias,
        leftJoinAndSelect: {
          ...(join && join.leftJoinAndSelect ? join.leftJoinAndSelect : {}),
          type: `${alias}.role`
        }
      }
    };
  }

  public async find(
    options?: FindManyOptions<MemberEntity> | FindManyOptionsFunc<MemberEntity>
  ): Promise<MemberEntity[]> {
    const alias = 'members';
    const op = typeof options === 'function' ? options(alias) : options;
    return getRepository(MemberEntity).find(this.prepareQuery(alias, op));
  }

  public async findOne(
    options?: FindOneOptions<MemberEntity> | FindOneOptionsFunc<MemberEntity>
  ): Promise<MemberEntity | undefined> {
    const alias = 'members';
    const op = typeof options === 'function' ? options(alias) : options;
    return getRepository(MemberEntity).findOne(this.prepareQuery(alias, op));
  }
}

export default MembersService;
