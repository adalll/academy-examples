import { RoleEnum } from '../../users/graphql/enums/role.enum'

export interface JwtPayload {
    sub: string
    iat?: number
    exp?: number
    jti?: string
    role: RoleEnum
    email?: string
    phone?: string
}
