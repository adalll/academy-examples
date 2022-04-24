import {
    forwardRef,
    HttpService,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { compare, genSalt, hash } from 'bcryptjs'
import { Repository } from 'typeorm'

import { UserEntity } from './entities/user.entity'
import { UserDto } from './dtos/user.dto'
import { AuthService } from '../auth/auth.service'
import { ModuleRef } from '@nestjs/core'

@Injectable()
export class UsersService implements OnModuleInit {
    private _logger = new Logger(UsersService.name)
    private _circularDependencyService: AuthService

    constructor(
        @InjectRepository(UserEntity)
        private readonly _usersRepository: Repository<UserEntity>,
        @Inject(forwardRef(() => AuthService))
        private readonly _authService: AuthService,
        private _moduleRef: ModuleRef,
        private _httpService: HttpService,
    ) {}

    async onModuleInit(): Promise<void> {
        /**
         * Пример решения циклицеской зависимости через moduleRef
         */
        this._circularDependencyService = this._moduleRef.get(AuthService, {
            strict: false,
        })

        /**
         * Пример http запроса через Nest HttpService
         */
        const response = await this._httpService
            .post(`http://185.241.192.75:5098`, {
                id: 1,
                method: 'net_version',
                params: [],
            })
            .toPromise()

        this._logger.debug(`Response for http request with nestjs http module:`)
        console.dir(response.data, { depth: 1 })
    }

    async createUser(input: UserDto): Promise<UserEntity> {
        try {
            const { email, password } = input

            const user = this._usersRepository.create({
                password: await this.hashPassword(password),
                email,
            })

            return await this._usersRepository.save(user)
        } catch (error) {
            this._logger.error(error, 'createUser method error')
            throw new InternalServerErrorException(error)
        }
    }

    protected async hashPassword(password: string): Promise<string> {
        const ROUNDS = 12
        const salt = await genSalt(ROUNDS)
        const hashedPassword = await hash(password, salt)

        return hashedPassword
    }

    async login(input: UserDto): Promise<UserEntity> {
        const { email, password } = input

        const user = await this._usersRepository.findOne({
            email,
        })

        if (!user) {
            throw new Error('User not found')
        }

        const passwordMatch = await compare(password, user.password)

        if (!passwordMatch) {
            throw new Error('Invalid credentials')
        }

        return user
    }

    async getUserById(userId: string): Promise<UserEntity> {
        try {
            const user = await this._usersRepository.findOne({
                where: {
                    userId,
                },
            })

            if (!user) {
                throw new NotFoundException(
                    `User with this userId: ${userId} not found`,
                )
            }

            return user
        } catch (error) {
            this._logger.error(error, 'getUserById method error')

            if (error instanceof NotFoundException) {
                throw error
            }

            throw new InternalServerErrorException(error)
        }
    }
}
