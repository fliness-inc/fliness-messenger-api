export interface Seeder<Entity> {
  run(count: number): Promise<Entity[]>;
}

export default Seeder;
