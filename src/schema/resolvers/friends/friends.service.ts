import { Injectable } from '@nestjs/common';
import { getRepository, FindManyOptions, DeepPartial, FindOneOptions } from 'typeorm';
import Friend from '@database/entities/friend';
import UsersService from '@schema/resolvers/users/users.service';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@schema/utils';

@Injectable()
export class FriendsService {

	public constructor(private readonly usersService: UsersService) {}

	public async find(options?: FindManyOptions<Friend> | FindManyOptionsFunc<Friend>): Promise<Friend[]> {
		const alias = 'friends';
		const op = typeof options === 'function' ? options(alias) : options;
		return getRepository(Friend).find(op);
	}

	public async findOne(options: FindOneOptions<Friend> | FindOneOptionsFunc<Friend>): Promise<Friend | undefined> {
		const alias = 'friends';
		const op = typeof options === 'function' ? options(alias) : options;
		return getRepository(Friend).findOne(op);
	}

	public async create(options: DeepPartial<Friend>): Promise<Friend> {
		const friends = getRepository(Friend);
		return friends.save(friends.create(options));
	}
}

export default FriendsService;
