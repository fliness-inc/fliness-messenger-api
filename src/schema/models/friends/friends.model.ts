import { ObjectType } from '@nestjs/graphql';
import User from '@schema/models/users/users.model';

@ObjectType()
export class Friend extends User {}

export default Friend;
