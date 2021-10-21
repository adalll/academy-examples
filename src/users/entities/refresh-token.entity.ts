import { CommonBaseEntity } from '@i-link/common'
import { Entity, Column } from 'typeorm'

@Entity('refresh_tokens')
export class RefreshTokenEntity extends CommonBaseEntity {
    @Column()
    userId: string

    @Column()
    token: string

    @Column()
    expiresAt: Date
}
