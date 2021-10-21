import {
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { compare, genSalt, hash } from 'bcryptjs'
import { Repository } from 'typeorm'

import { UserEntity } from './entities/user.entity'
import { CreateUserDto } from './dtos/create-user.dto'

@Injectable()
export class UsersService {
    private _logger = new Logger(UsersService.name)

    constructor(
        @InjectRepository(UserEntity)
        private readonly _usersRepository: Repository<UserEntity>,
    ) {}

    async createUser(input: CreateUserDto): Promise<UserEntity> {
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

    async login(input: CreateUserDto): Promise<UserEntity> {
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
