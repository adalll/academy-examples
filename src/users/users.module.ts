import { forwardRef, HttpModule, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UsersService } from './users.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from './entities/user.entity'
import { AuthModule } from '../auth/auth.module'

@Module({
    imports: [
        HttpModule,
        ConfigService,
        TypeOrmModule.forFeature([UserEntity]),
        forwardRef(() => AuthModule),
    ],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
