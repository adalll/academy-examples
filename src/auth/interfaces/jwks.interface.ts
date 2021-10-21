import { Algorithm } from 'jsonwebtoken'

export interface Jwks {
    kid: string
    alg: Algorithm
    pem: string
}

export interface Jwk {
    kty: string
    e: string
    n: string
    use: string
    kid: string
    alg: Algorithm
}
