import { Injectable } from '@nestjs/common';
import { getRepository, FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';
import { User } from '@database/entities/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {

	public constructor( 
		@InjectRepository(User)
		private readonly userRepository: Repository<User>
	) {}

	public async find(options?: FindManyOptions<User>): Promise<User[]> {
		return this.userRepository.find(options);
	}

	public async findOne(options?: FindOneOptions<User>): Promise<User | undefined> {
		return this.userRepository.findOne(options);
	}

	public async findByIds(ids: string[], options?: FindManyOptions<User>): Promise<(User | undefined)[]> {
		const users = await this.userRepository.findByIds(ids, options);
		return ids.map(id => users.find(u => u.id === id));
	}

	public async create(entity: DeepPartial<User>): Promise<User> {
		const users = getRepository(User);
		return users.save(users.create(entity));
	}

} 

export default UsersService;