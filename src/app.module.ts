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
            autoSchemaFile: true,
            cors: {
                credentials: true,
                origin: true
            },
            context: ({ req, res }) => ({ req, res })
        }),
        SchemaModule
    ]
})
export class AppModule {}

export default AppModule;
