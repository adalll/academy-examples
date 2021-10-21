import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { AuthService } from '../auth.service'

export class RequestAuthorizationTokenHeader {
    'authorization': string
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly _authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context)
        /* eslint-disable-next-line */
        const req: Request | any = ctx.getContext().req

        const {
            authorization: authorization,
        }: RequestAuthorizationTokenHeader = req.headers

        if (authorization == undefined) {
            throw new BadRequestException(
                'GqlAuthorizationHeader: header authorization is empty',
            )
        }

        const verified = await this._authService.decodeToken(authorization)

        return !!verified
    }
}
