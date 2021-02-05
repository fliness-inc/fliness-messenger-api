import { Module } from '@nestjs/common';
import Cursor from './cursor.scalar';

@Module({
  providers: [Cursor]
})
export class ScalarsModule {}

export default ScalarsModule;
