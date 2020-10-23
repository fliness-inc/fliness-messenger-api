import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import { validate, version } from 'uuid';

@Scalar('UUID')
export class UUID implements CustomScalar<string, string> {
    public parseValue(value: string): string {
        if (validate(value) && version(value) === 4)
            return value;
        
        return null;
    }

    public serialize(value: string): string {
        if (validate(value) && version(value) === 4)
            return value;
        
        return null;
    }

    public parseLiteral(ast: ValueNode): string | null {
        if (ast.kind === Kind.STRING && 
            validate(ast.value) && 
            version(ast.value) === 4) 
        {
            return ast.value
        }

        return null;
    }
}

export default UUID;