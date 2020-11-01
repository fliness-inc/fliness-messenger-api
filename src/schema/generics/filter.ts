import { Field, registerEnumType, InputType } from '@nestjs/graphql';
import { OperatorTypeEnum } from '@src/filter/filter';

registerEnumType(OperatorTypeEnum, {
	name: 'ArgumentOperatorType'
});

export function Filter<T>(enumType: any, options): any {

    @InputType(`${options.name}ArgumentField`)
	abstract class FilterArgumentField {
        @Field(() => enumType)
        public readonly name: T;

        @Field(() => OperatorTypeEnum)
        public readonly op: OperatorTypeEnum;
    
        @Field(() => String)
        public readonly val: string;
    }

    @InputType({ isAbstract: true })
    abstract class FilterArgument {
        @Field(() => FilterArgumentField)
        public readonly field: FilterArgumentField;
        
        @Field(() => [FilterArgument], { nullable: true })
        public readonly AND?: FilterArgument[];

        @Field(() => [FilterArgument], { nullable: true })
        public readonly OR?: FilterArgument[];
    }

    return FilterArgument;
}

export default Filter;