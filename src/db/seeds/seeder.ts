import { getRepository, ObjectType } from 'typeorm';
import { Factory } from './factory';

export function MakeSeeder<E>(type: ObjectType<E>): any {
  abstract class Seeder {
    public constructor(private readonly factory: Factory<E>) {}

    public async run(count: number, options: any = {}): Promise<E[]> {
      const entities = [];

      if (!Array.isArray(options))
        for (let i = 0; i < count; ++i)
          entities.push(
            await getRepository(type).save(this.factory.create(options))
          );
      else
        for (let i = 0; i < Math.min(options.length, count); ++i)
          entities.push(
            await getRepository(type).save(this.factory.create(options[i]))
          );

      return entities;
    }
  }

  return Seeder;
}

export default MakeSeeder;
