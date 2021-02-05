import { Controller, Get, Param, Res } from '@nestjs/common';

@Controller('public/')
export class FileController {
  @Get(':name')
  getImage(@Param() param, @Res() res): string {
    return res.sendFile(param.name, { root: 'public/img' });
  }
}

export default FileController;
