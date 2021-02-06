import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import SchemaModule from '@schema/schema.module';
import FileModule from '@src/controllers/file/file.module';
import PaginationModule from '@lib/pagination/pagination.module';
import PublicURLDirective from '@schema/directives/publicURL';

const { NODE_ENV } = process.env;

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    GraphQLModule.forRoot({
      debug: NODE_ENV === 'development',
      playground: NODE_ENV === 'development',
      installSubscriptionHandlers: true,
      fieldResolverEnhancers: ['guards', 'interceptors', 'filters'],
      autoSchemaFile: true,
      introspection: true,
      sortSchema: true,
      cors: {
        credentials: true,
        origin: 'http://localhost:3000'
      },
      context: ({ req, res }) => {
        const ctx = {
          res,
          req,
          dataloaders: new WeakMap()
        };
        return ctx;
      },
      schemaDirectives: {
        publicURL: PublicURLDirective
      }
    }),
    SchemaModule,
    FileModule,
    PaginationModule
  ]
})
export class AppModule {}

export default AppModule;
