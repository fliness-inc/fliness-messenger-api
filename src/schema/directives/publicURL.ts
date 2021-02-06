import { SchemaDirectiveVisitor } from 'apollo-server';
import { defaultFieldResolver, GraphQLField } from 'graphql';

const { HOST, PORT } = process.env;

export class PublicURLDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field;
    const { join = '' } = this.args;

    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args);
      if (typeof result === 'string') {
        return `http://${HOST}:${PORT}/public/${join}${result}`;
      }
      return result;
    };
  }
}

export default PublicURLDirective;
