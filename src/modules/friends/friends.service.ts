/* import { Injectable } from '@nestjs/common';
import { getRepository, FindManyOptions, DeepPartial, FindOneOptions } from 'typeorm';
import { Friend } from '@database/entities/friend';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class FriendsService {

    public constructor(private readonly usersService: UsersService) {}

    public async find(options?: FindManyOptions<Friend>): Promise<Friend[]> {
        return getRepository(Friend).find(options);
    }

    public async findOne(options: FindOneOptions<Friend>): Promise<Friend | undefined> {
        return getRepository(Friend).findOne(options);
    }

    public async create(options: DeepPartial<Friend>): Promise<Friend> {
        const friends = getRepository(Friend);
        return friends.save(friends.create(options));
    }
}

export default FriendsService;
 */