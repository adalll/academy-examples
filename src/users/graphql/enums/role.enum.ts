import { registerEnumType } from '@nestjs/graphql'

export enum RoleEnum {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

registerEnumType(RoleEnum, {
    name: 'RoleEnum',
})
