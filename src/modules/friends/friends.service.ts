import { Injectable } from '@nestjs/common';
import { getRepository, FindManyOptions } from 'typeorm';
import { Friend } from '@database/entities/friend';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class FriendsService {

    public constructor(private readonly usersService: UsersService) {}

    public async find(options?: FindManyOptions<Friend>): Promise<Friend[]> {
        return getRepository(Friend).find(options);
    }
}

export default FriendsService;
