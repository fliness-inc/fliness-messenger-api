export interface Factory<Entity> {
  create(entity?: Partial<Entity>): Entity;
}

export default Factory;
