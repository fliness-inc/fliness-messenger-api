import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import SchemaModule from '@schema/schema.module';
import FileModule from '@src/controllers/file/file.module';
import PaginationModule from '@lib/pagination/pagination.module';
import PublicURLDirective from '@schema/directives/publicURL';
import { Context } from '@schema/utils';

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
      subscriptions: {
        onConnect(params) {
          return {
            token: params['Authorization']
          };
        }
      },
      context: (params): Context => {
        // ws
        if (params.connection)
          return {
            ...params.connection.context,
            dataloaders: new WeakMap()
          };

        const { req, res } = params;
        return {
          res,
          req,
          dataloaders: new WeakMap()
        };
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
