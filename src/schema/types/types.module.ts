import {Module} from '@nestjs/common';

import UUID from '@schema/types/uuid';
import DateTime from '@schema/types/datetime';
/* import Cursor from '@schema/types/cursor';
import Sort from '@schema/types/sort'; */

@Module({
    providers: [
        UUID,
        DateTime,
    ]
})
export class TypesModule {}

export default TypesModule;