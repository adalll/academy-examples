import { HttpService, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomBytes } from 'crypto'
import { sign, SignOptions, verify, decode } from 'jsonwebtoken'
import * as moment from 'moment'
import { v4 as Uuidv4 } from 'uuid'
import * as fs from 'fs'

import { CreateUserDto } from '../users/dtos/create-user.dto'
import { UserEntity } from '../users/entities/user.entity'
import { UsersService } from '../users/users.service'
import { AuthType } from './graphql/types/auth.type'
import { JwtPayload } from './interfaces/jwtpayload.interface'
import { RoleEnum } from '../users/graphql/enums/role.enum'
import { RefreshTokenEntity } from '../users/entities/refresh-token.entity'

const DEFAULT_ACCESS_TOKEN_TTL = 600

@Injectable()
export class AuthService {
    private _logger = new Logger(AuthService.name)

    private readonly _alg: string
    private readonly _expiresInSeconds: number
    private readonly _jwtOptions: SignOptions
    private readonly _jwtPrivateKey
    private readonly _jwtPublicKey
    private readonly _tokenType: string
    private readonly _refreshTokenTtl: number

    constructor(
        private readonly _configService: ConfigService,
        private readonly _httpService: HttpService,
        private readonly _usersService: UsersService,
        @InjectRepository(RefreshTokenEntity)
        private readonly _refreshTokenRepository: Repository<RefreshTokenEntity>,
    ) {
        this._alg = this._configService.get<string>('ALGORITHM') as string
        this._expiresInSeconds = +this._configService.get<number>(
            'ACCESS_TOKEN_TTL',
            DEFAULT_ACCESS_TOKEN_TTL,
        )
        this._jwtOptions = {
            expiresIn: this._expiresInSeconds,
            algorithm: 'RS256',
            keyid: 'main',
        }
        this._jwtPrivateKey = fs.readFileSync(
            `${process.cwd()}/assets/private.key`,
        )
        this._jwtPublicKey = fs.readFileSync(
            `${process.cwd()}/assets/public.key`,
        )

        /**
         * ssh-keygen -t rsa -b 4096 -m PEM -f private.key
         * openssl rsa -in private.key -pubout -outform PEM -out public.key
         * **/

        this._tokenType = this._configService.get<string>(
            'TOKEN_TYPE',
            'Bearer',
        )

        this._refreshTokenTtl = +this._configService.get<number>(
            'REFRESH_TOKEN_TTL',
            1,
        )
    }

    async signUp(input: CreateUserDto): Promise<UserEntity> {
        const user = await this._usersService.createUser(input)

        return user
    }

    async signIn(input: CreateUserDto): Promise<AuthType> {
        const loginResults = await this._usersService.login(input)
        if (!loginResults) {
            throw new Error('Forbidden login')
        }

        const { id } = loginResults

        const payload: JwtPayload = {
            sub: id,
            role: RoleEnum.USER,
        }

        const jwt = await this.createJWT(payload)

        return jwt
    }

    protected async createJWT(payload: JwtPayload): Promise<AuthType> {
        const jwt = await this.createAccessToken(payload)
        jwt.refreshToken = await this.createRefreshToken(payload.sub)

        return jwt
    }

    protected async createAccessToken(
        payload: JwtPayload,
        expires = this._expiresInSeconds,
    ): Promise<AuthType> {
        const options = this._jwtOptions
        options.expiresIn = expires
        options.jwtid = Uuidv4()

        const signedPayload = sign(payload, this._jwtPrivateKey, options)

        return {
            accessToken: signedPayload,
            expiresIn: expires,
            tokenType: this._tokenType,
        } as AuthType
    }

    protected async createRefreshToken(userId: string): Promise<string> {
        const REFRESH_TOKEN_LENGTH = 64
        const refreshToken = randomBytes(REFRESH_TOKEN_LENGTH).toString('hex')
        const token = {
            userId,
            token: refreshToken,
            expiresAt: moment().add(this._refreshTokenTtl, 'd').toDate(),
        }
        const newRefreshToken = await this._refreshTokenRepository.create(token)
        await this._refreshTokenRepository.save(newRefreshToken)

        return newRefreshToken.token
    }

    async getAccessTokenFromRefreshToken(
        refreshToken: string,
        oldAccessToken: string,
    ): Promise<AuthType> {
        const token = await this._refreshTokenRepository.findOne({
            token: refreshToken,
        })
        const currentDate = new Date()
        if (!token) {
            throw new Error('Refresh token not found')
        }
        if (token.expiresAt < currentDate) {
            throw new Error('Refresh token expired')
        }
        const oldPayload = await this.decodeToken(oldAccessToken)

        const payload: JwtPayload = {
            sub: oldPayload.sub,
            role: oldPayload.role,
        }

        const jwt = await this.createJWT(payload)

        await this._refreshTokenRepository.delete({ id: token.id })

        return jwt
    }

    async verifyToken(token: string): Promise<{ isVerified: boolean }> {
        try {
            verify(token, this._jwtPublicKey, {
                algorithms: [this._alg],
            })
            return {
                isVerified: true,
            }
        } catch (error) {
            this._logger.error(error)
            this._logger.warn(token)
            return {
                isVerified: false,
            }
        }
    }

    async decodeToken(token: string): Promise<JwtPayload> {
        const response = await this.verifyToken(token)
        if (response.isVerified) {
            const parsedToken: { sub: string; role: RoleEnum } = await decode(
                token,
            )
            console.dir(parsedToken, { depth: undefined })
            return parsedToken
        }
        return undefined
    }
}
