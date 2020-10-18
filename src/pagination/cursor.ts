export type Cursor = string;

export type PaginationFilters = {
    [key: string]: string | number | Date;
};

export class CursorCoder {
    public static encode(entity: PaginationFilters) : Cursor {
        const prepareData = Object.entries(entity).map(data => {
            const [key, value] = data;

            switch(typeof value) {
                case 'string': {
                    return `${key}:string:${encodeURIComponent(value)}`;
                }
                case 'number': {
                    if (Number.isNaN(value)) 
                        throw new Error(`Unknown '${typeof value}' type in cursor '${key}' property: ${value}`);

                    return `${key}:number:${value.toString()}`;
                }
                case 'object': {
                    if (value instanceof Date) 
                        return `${key}:date:${value.getTime().toString()}`;

                    throw new Error(`Unknown '${typeof value}' type in cursor '${key}' property: ${value}`);
                }
                default: {
                    throw new Error(`Unknown '${typeof value}' type in cursor '${key}' property: ${value}`);
                }
            }
        });

        if (!prepareData.length)
            throw new Error('Not found any fields');

        const cursor: Cursor = Buffer.from(prepareData.join(',')).toString('base64');
        return cursor;
    }

    public static decode(cursor: Cursor): PaginationFilters {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
        const fields = decodedCursor.split(',');

        if (!fields.length)
            throw new Error('Not found any fields');

        const filters: PaginationFilters = {};

        fields.forEach(data => {
            const [key, type, value] = data.split(':');

            switch(type) {
                case 'string': {
                    filters[key] = decodeURIComponent(value);
                    break;
                }
                case 'number': {
                    const num = parseInt(value, 10);

                    if (Number.isNaN(num))
                        throw new Error('The number column in cursor should be a valid number');

                    filters[key] = num;
                    break;
                }
                case 'date': {
                    const timestamp = parseInt(value, 10);

                    if (Number.isNaN(timestamp))
                        throw new Error('The date column in cursor should be a valid timestamp');

                    const data = new Date(timestamp);

                    if (Number.isNaN(data.getTime()))
                        throw new Error(`Unknown '${type}' type in cursor '${key}' property: ${value}`);
                    
                    filters[key] = data;
                    break;
                }
                default: {
                    throw new Error(`Unknown '${type}' type in cursor '${key}' property: ${value}`);
                }
            }
        });

        return filters;
    }
}
