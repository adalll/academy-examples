import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'

import { AuthService } from './auth.service'
import { UserType } from '../users/graphql/types/user.type'
import { CreateUserInput } from '../users/graphql/inputs/create-user.input'
import { AuthType } from './graphql/types/auth.type'
import { AuthGuard } from './guards/auth.guard'

@Resolver(() => String)
export class AuthResolver {
    constructor(private readonly _authService: AuthService) {}

    @Query(() => String, {
        description: 'Returns pong',
    })
    async ping(): Promise<string> {
        return 'pong'
    }

    @Mutation(() => UserType)
    async signUp(@Args('input') input: CreateUserInput): Promise<UserType> {
        const response = await this._authService.signUp(input)

        return response
    }

    @Query(() => AuthType)
    async signIn(@Args('input') input: CreateUserInput): Promise<AuthType> {
        const response = await this._authService.signIn(input)

        return response
    }

    @UseGuards(AuthGuard)
    @Mutation(() => String)
    async protectedMethod(): Promise<string> {
        return 'Authorization was successful'
    }

    @Mutation(() => AuthType)
    async refreshToken(
        @Args('refreshToken') refreshToken: string,
        @Args('accessToken') accessToken: string,
    ): Promise<AuthType> {
        return await this._authService.getAccessTokenFromRefreshToken(
            refreshToken,
            accessToken,
        )
    }
}
