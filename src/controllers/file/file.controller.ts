import { Controller, Get, Param, Res } from '@nestjs/common';

@Controller('public/')
export class FileController {
  @Get('img/:name')
  getImage(@Param() param, @Res() res): string {
    return res.sendFile(param.name, { root: 'public/img' });
  }
  @Get(':name')
  getRootFile(@Param() param, @Res() res): string {
    return res.sendFile(param.name, { root: 'public' });
  }
}

export default FileController;
