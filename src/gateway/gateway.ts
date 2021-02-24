import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway()
export default class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  @SubscribeMessage('events')
  handleEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string
  ): string {
    console.log('msg', data);
    return data;
  }

  async handleConnection(client: Socket, req: Request) {
    console.log('connected', client.id);
  }

  async handleDisconnect(client: Socket) {
    console.log('disconnected', client.id);
  }
}
