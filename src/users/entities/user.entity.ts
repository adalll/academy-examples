import { CommonBaseEntity } from '@i-link/common'
import { Entity, Column } from 'typeorm'

@Entity('users')
export class UserEntity extends CommonBaseEntity {
    @Column()
    email: string

    @Column()
    password: string
}
