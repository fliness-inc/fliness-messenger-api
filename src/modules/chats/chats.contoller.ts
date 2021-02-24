import { Controller, Get } from '@nestjs/common';

@Controller('/chats')
export class ChatsController {
  @Get()
  public getChats() {
    return;
  }

  @Get('/:id')
  public getChat() {
    return;
  }
}

export default ChatsController;
