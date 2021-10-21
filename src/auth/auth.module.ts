import { HttpModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'

import { AuthService } from './auth.service'
import { AuthResolver } from './auth.resolver'
import { UsersModule } from '../users/users.module'
import { RefreshTokenEntity } from '../users/entities/refresh-token.entity'

@Module({
    imports: [
        HttpModule,
        UsersModule,
        ConfigService,
        TypeOrmModule.forFeature([RefreshTokenEntity]),
    ],
    providers: [AuthService, AuthResolver],
    exports: [AuthService],
})
export class AuthModule {}
