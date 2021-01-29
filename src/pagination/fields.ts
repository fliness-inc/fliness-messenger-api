
export const makeEnumField = (entityAlias: string, fieldName: string) => {
	return `"${entityAlias}"."${fieldName}"`;
}

export const makeFormatedField = (entityAlias: string, fieldName: string) => {
	return `${entityAlias.toLowerCase()}_${fieldName.toLowerCase()}`;
}

export const makeSelectField = (entityAlias: string, fieldName: string) => {
	return `${makeEnumField(entityAlias, fieldName)} AS ${makeFormatedField(entityAlias, fieldName)}`;
}

export default {
    makeEnumField,
    makeSelectField,
    makeFormatedField
}