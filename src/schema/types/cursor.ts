import {Scalar, CustomScalar} from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Cursor')
export class Cursor implements CustomScalar<string, string> {
	public parseValue(value: string): string {
		return value;
	}

	public serialize(value: string): string {
		return value;
	}

	public parseLiteral(ast: ValueNode): string | null {
		if (ast.kind === Kind.STRING) 
			return ast.value;

		return null;
	}
}

export default Cursor;