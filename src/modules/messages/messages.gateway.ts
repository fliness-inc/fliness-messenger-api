import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import MessageEntity from '~/db/entities/message.entity';
import MembersService from '../members/members.service';
import TokensService from '../tokens/tokens.service';
import { EVENTS } from './messages.dto';

export interface Pool<P = any> {
  [key: string]: P;
}

@WebSocketGateway({ path: '/messages' })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private clientPool: Map<Socket, { userId: string }> = new Map();

  public constructor(
    private readonly tokensService: TokensService,
    private readonly membersService: MembersService
  ) {}

  async messageCreatedEvent(chatId: string, message: MessageEntity) {
    for (const [client, data] of this.clientPool) {
      const member = await this.membersService.findOne({
        select: ['id'],
        where: { userId: data.userId, chatId },
      });
      if (!member) return;

      client.emit(EVENTS.MESSAGE_CREATED_EVETN, {
        chatId,
        message,
      });
    }
  }

  async handleConnection(client: Socket) {
    const cookies: string[] = client.handshake.headers.cookie.split('; ');
    let token: string | null = null;

    cookies.forEach(cookie => {
      const t = cookie.split('=');

      if (t[0] !== 'jwt-token') return;

      token = t[1];
    });

    const tokenEntity = await this.tokensService.findOne({
      select: ['userId'],
      where: { token },
    });

    if (!tokenEntity) {
      client.error('unauthorized');
      client.disconnect();
      return;
    }

    this.clientPool.set(client, { userId: tokenEntity.userId });
  }

  async handleDisconnect(client: Socket) {
    this.clientPool.delete(client);
  }
}

export default MessagesGateway;
