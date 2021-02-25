export abstract class Factory<Entity> {
  public abstract create(entity?: Partial<Entity>): Entity;
}

export default Factory;
