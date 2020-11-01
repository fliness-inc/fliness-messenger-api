import { CursorCoder, Cursor, PaginationFilters } from '@src/pagination/cursor';

describe('[E2E] [Pagination] ', () => {
    describe('The cursor coder', () => {
        it('should encode and decode the cursor', () => {
            const paginationFilters: PaginationFilters  = { id: 'sdfasf', name: 'fdsafasdf', createdAt: new Date(), number: 5 };
            const cursor: Cursor = CursorCoder.encode(paginationFilters);
            const decodedCursor: PaginationFilters = CursorCoder.decode(cursor);

            expect(decodedCursor).toStrictEqual(paginationFilters);
        });

        it('should throw an error while encoding a cursor when the property is null', () => {
            const paginationFilters: PaginationFilters  = { id: null };
            expect(() => CursorCoder.encode(paginationFilters)).toThrow(Error);
        });

        it('should throw an error while encoding a cursor when the property is NaN', () => {
            const paginationFilters: PaginationFilters  = { id: Number.NaN };
            expect(() => CursorCoder.encode(paginationFilters)).toThrow(Error);
        });

        it('should throw an error while encoding a cursor when the cursor is string', () => {
            const paginationFilters: any = 'invalid cursor';
            expect(() => CursorCoder.encode(paginationFilters)).toThrow(Error);
        });
    });
});