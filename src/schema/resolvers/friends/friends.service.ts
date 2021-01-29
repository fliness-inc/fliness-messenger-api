import { Injectable } from '@nestjs/common';
import { FindManyOptions, DeepPartial, FindOneOptions } from 'typeorm';
import FriendEntity from '@database/entities/friend';
import { FindManyOptionsFunc, FindOneOptionsFunc } from '@schema/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FriendsService {

	public constructor(
		@InjectRepository(FriendEntity)
		private readonly friendRepository: Repository<FriendEntity>
	) {}

	public async find(options?: FindManyOptions<FriendEntity> | FindManyOptionsFunc<FriendEntity>): Promise<FriendEntity[]> {
		const alias = 'friends';
		const op = typeof options === 'function' ? options(alias) : options;
		return this.friendRepository.find(op);
	}

	public async findOne(options: FindOneOptions<FriendEntity> | FindOneOptionsFunc<FriendEntity>): Promise<FriendEntity | undefined> {
		const alias = 'friends';
		const op = typeof options === 'function' ? options(alias) : options;
		return this.friendRepository.findOne(op);
	}

	public async create(options: DeepPartial<FriendEntity>): Promise<FriendEntity> {
		return this.friendRepository.save(this.friendRepository.create(options));
	}
}

export default FriendsService;
