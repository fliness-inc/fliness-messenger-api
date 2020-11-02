import { Field, registerEnumType, InputType } from '@nestjs/graphql';
import { OperatorTypeEnum } from '@src/filter/filter';
import { Type } from '@nestjs/common';

registerEnumType(OperatorTypeEnum, {
	name: 'ArgumentOperatorType'
});

export function Filter<T>(classRef: Type<T>, enumType: any): any {

    @InputType(`${classRef.name}FilterArgumentField`)
	abstract class FilterArgumentField {
        @Field(() => enumType)
        public readonly name: T;

        @Field(() => OperatorTypeEnum)
        public readonly op: OperatorTypeEnum;
    
        @Field(() => String)
        public readonly val: string;
    }

    @InputType(`${classRef.name}Filter`, { isAbstract: true }) 
    abstract class FilterArgument {
        @Field(() => FilterArgumentField, { nullable: true })
        public readonly field?: FilterArgumentField;
        
        @Field(() => [FilterArgument], { nullable: true })
        public readonly AND?: FilterArgument[];

        @Field(() => [FilterArgument], { nullable: true })
        public readonly OR?: FilterArgument[];
    }

    return FilterArgument;
}

export default Filter;