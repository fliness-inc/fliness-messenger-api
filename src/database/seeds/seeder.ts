import { getRepository, ObjectType } from 'typeorm';
import { Factory } from './factory';

export function MakeSeeder<E>(type: ObjectType<E>): any {

    abstract class Seeder {
        public constructor(private readonly factory: Factory<E>) {}

        public async run(count: number, options: any = {}): Promise<E[]> {
            const entities = [];

            for (let i = 0; i < count; ++i)
                entities.push(await getRepository(type).save(this.factory.create(options)));

            return entities;
        }
    }

    return Seeder;
}

export default MakeSeeder;
