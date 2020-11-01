import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('DateTime')
export class DateTime implements CustomScalar<string, Date> {
    description = 'Date custom scalar type';

    parseValue(value: string): Date {
    	return new Date(value);
    }

    serialize(value: Date): string {
    	return value.toISOString();
    }

    parseLiteral(ast: ValueNode): Date {
    	if (ast.kind === Kind.STRING)
    		return new Date(ast.value);
    	return null;
    }
}

export default DateTime;