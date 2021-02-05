import { SelectQueryBuilder, Brackets, WhereExpression } from 'typeorm';

/*
filter: {
    OR: [
        { field: {...} },
        { field: {...} },
        { field: {...} }
    ],
}

WHERE (arg OR arg OR arg);

filter: {
    OR: [
        { field: {...} },
        { field: {...} },
        { AND: [
                { field: {...} }, 
                { field: {...} }, 
            ] 
        }
    ],
}

WHERE (arg OR arg OR (arg AND arg));
*/

export enum OperatorTypeEnum {
  EQUALS = '=',
  NOT_EQUAL = '<>',
  LESS = '<',
  LESS_OR_EQUAL = '<=',
  GREATER = '>',
  GREATER_OR_EQUAL = '>='
  /* 
    IN,
    NOT_IN,
    CONTAINS = '',
    START_WITH = '',
    END_WITH = '' */
}

export interface ILogicalOperator {
  exec(query: FilterArg[], qb: WhereExpression): void;
}

export class FilterField {
  public readonly name: string;
  public readonly op: OperatorTypeEnum;
  public readonly val: string | unknown[] | number;
}

export class FilterArg {
  public readonly field?: FilterField;
  public readonly OR?: FilterArg[];
  public readonly AND?: FilterArg[];
}

export class AndOperator<T> implements ILogicalOperator {
  private readonly orOperator: OrOperator<T>;

  public constructor(private readonly builder: SelectQueryBuilder<T>) {
    this.orOperator = new OrOperator<T>(builder);
  }

  public exec(query: FilterArg[] = [], qb: WhereExpression) {
    for (const q of query) {
      if (q.field) {
        if (q.AND || q.OR)
          throw new Error(
            `The field and logical operator cannot be use at the same time`
          );

        qb.andWhere(`${q.field.name} ${q.field.op} :val`, { val: q.field.val });
      } else {
        qb.andWhere(
          new Brackets(b => {
            if (q.AND) this.exec(q.AND, b);
            if (q.OR) this.orOperator.exec(q.OR, b);
          })
        );
      }
    }
  }
}

export class OrOperator<T> implements ILogicalOperator {
  public constructor(private readonly builder: SelectQueryBuilder<T>) {}

  public exec(query: FilterArg[] = [], qb: WhereExpression) {
    const andOperator = new AndOperator<T>(this.builder);

    for (const q of query) {
      if (q.field) {
        if (q.AND || q.OR)
          throw new Error(
            `The field and logical operator cannot be use at the same time`
          );

        qb.orWhere(`${q.field.name} ${q.field.op} :val`, { val: q.field.val });
      } else {
        qb.orWhere(
          new Brackets(b => {
            if (q.AND) andOperator.exec(q.AND, b);
            if (q.OR) this.exec(q.OR, b);
          })
        );
      }
    }
  }
}

export class Filter<T> {
  private readonly andOperator: AndOperator<T>;
  private readonly orOperator: OrOperator<T>;

  public constructor(private readonly builder: SelectQueryBuilder<T>) {
    this.andOperator = new AndOperator<T>(builder);
    this.orOperator = new OrOperator<T>(builder);
  }

  public make(q?: FilterArg): SelectQueryBuilder<T> {
    if (!q?.field && !q?.AND && !q?.OR) return this.builder;

    this.builder.andWhere(
      new Brackets(qb => {
        if (q.field)
          qb.andWhere(`${q.field.name} ${q.field.op} :val`, {
            val: q.field.val
          });

        if (q.AND) this.andOperator.exec(q.AND, qb);

        if (q.OR) this.orOperator.exec(q.OR, qb);
      })
    );

    return this.builder;
  }
}

export default Filter;
