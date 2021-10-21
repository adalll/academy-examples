import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GraphQLModule } from '@nestjs/graphql'

import { config } from './config/config'
import { typeOrmConfig } from './config/typeorm.config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'

@Module({
    imports: [
        ConfigModule.forRoot(config),
        TypeOrmModule.forRootAsync(typeOrmConfig),
        GraphQLModule.forRoot({
            installSubscriptionHandlers: true,
            autoSchemaFile: 'schema.gql',
            playground: true,
            introspection: true,
        }),
        AuthModule,
        UsersModule,
    ],
})
export class AppModule {}
