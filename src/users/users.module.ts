import { HttpModule, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UsersService } from './users.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from './entities/user.entity'

@Module({
    imports: [
        HttpModule,
        ConfigService,
        TypeOrmModule.forFeature([UserEntity]),
    ],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
