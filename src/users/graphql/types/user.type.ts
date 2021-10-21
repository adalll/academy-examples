import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType('User')
export class UserType {
    @Field(() => String)
    email: string
}
