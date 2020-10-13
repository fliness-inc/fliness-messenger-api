import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ApiTags} from '@nestjs/swagger';

@ApiTags('ws')
@WebSocketGateway()
export class AppGateway {

    @WebSocketServer()
    public server: Server;

    @SubscribeMessage('event') 
    public async handleEvent(@MessageBody() payload: string): Promise<string> {
        return 'sad';
    }
}

export default AppGateway;