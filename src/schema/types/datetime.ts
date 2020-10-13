import {Scalar, CustomScalar} from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('DateTime')
export class DateTime implements CustomScalar<string, Date> {
    public parseValue(value: string): Date {
        return new Date(value);
    }

    public serialize(value: Date): string {
        return value.toJSON();
    }

    public parseLiteral(ast: ValueNode): Date | null {
        if (ast.kind === Kind.STRING)
            return new Date(ast.value);

        return null;
    }
}

export default DateTime;