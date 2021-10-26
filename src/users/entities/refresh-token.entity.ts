import { Entity, Column } from 'typeorm'
import { CommonBaseEntity } from './common-base-entity.entity'

@Entity('refresh_tokens')
export class RefreshTokenEntity extends CommonBaseEntity {
    @Column()
    userId: string

    @Column()
    token: string

    @Column()
    expiresAt: Date
}
