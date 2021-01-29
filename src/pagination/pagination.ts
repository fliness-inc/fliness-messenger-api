import Paginator from './paginator';
import Fields from './fields';

export { Paginator } from './paginator';
export { makeEnumField, makeFormatedField, makeSelectField } from './fields';

export interface EnumKeys {
    [key: string]: string
}

export const makeEnum = (keys: EnumKeys): any => {
    enum E {}

    Object.entries(keys).map((entry) => {
        const [ key, val ] = entry;
        E[key] = val;
    });

    return E;
}

export default {
    Paginator,
    ...Fields,
    makeEnum
}