export const makeBaseField = (table: string, column: string) => {
  return `"${table}"."${column}"`;
};

export const makeUniqueField = makeBaseField;
export const makeEnumField = makeBaseField;

export const makeFormatedField = (table: string, column: string) => {
  return `${table}_${column}`;
};

export const makeSelectField = (table: string, column: string) => {
  return `${makeBaseField(table, column)} AS ${makeFormatedField(
    table,
    column
  )}`;
};

export interface EnumKeys {
  [key: string]: string;
}

export const makeEnum = (keys: EnumKeys): any => {
  enum E {}

  Object.entries(keys).map(entry => {
    const [key, val] = entry;
    E[key] = val;
  });

  return E;
};

export default {
  makeEnumField,
  makeBaseField,
  makeUniqueField,
  makeSelectField,
  makeFormatedField,
  makeEnum
};
