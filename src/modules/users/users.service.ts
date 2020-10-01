import { Injectable } from '@nestjs/common';
import { getRepository, FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';
import { User } from '@database/entities/user';
 
@Injectable()
export class UsersService {

    public constructor() {}

    public async find(options?: FindManyOptions<User>): Promise<User[]> {
        return getRepository(User).find(options);
    }

    public async findOne(options?: FindOneOptions<User>): Promise<User | undefined> {
        return getRepository(User).findOne(options);
    }

    public async create(entity: DeepPartial<User>): Promise<User> {
        const users = getRepository(User);
        return users.save(users.create(entity));
    }

} 

export default UsersService;