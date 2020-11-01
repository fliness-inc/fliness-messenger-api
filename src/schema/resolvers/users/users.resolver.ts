import { Resolver } from '@nestjs/graphql';
import User from '@schema/models/users.model';
 
@Resolver(() => User)
export class UsersResolver {
    
}

export default UsersResolver;