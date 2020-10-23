import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import SchemaModule from '@schema/schema.module';
 
@Module({
    imports: [
        TypeOrmModule.forRoot(), 
        GraphQLModule.forRoot({
            debug: true,
            playground: true,
            installSubscriptionHandlers: true,
            fieldResolverEnhancers: ['guards'],
            autoSchemaFile: true,
            cors: {
                credentials: true,
                origin: '*'
            },
            context: ({ req, res }) => { 
                const ctx = { 
                    res,
                    req,
                    dataloaders: new WeakMap()
                }
                return ctx; 
            }
        }),
        SchemaModule
    ]
})
export class AppModule {}

export default AppModule;
