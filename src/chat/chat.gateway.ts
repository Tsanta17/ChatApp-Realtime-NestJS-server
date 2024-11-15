import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service'; // Assurez-vous que ce chemin est correct

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  // Store user pseudonyms in a map
  private users: Map<string, string> = new Map(); // client.id -> pseudonym

  // Gérer les connexions
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Gérer les déconnexions
  handleDisconnect(client: Socket) {
    const pseudonym = this.users.get(client.id) || client.id;
    console.log(`${pseudonym} disconnected`);
    this.server.emit('message', `${pseudonym} has left`);
    this.users.delete(client.id);
  }

  // Recevoir pseudonym venant du frontend et l'enregistrer
  @SubscribeMessage('setPseudonym')
  handleSetPseudonym(
    @MessageBody() pseudonym: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.users.set(client.id, pseudonym);
    console.log(`${client.id} is now known as ${pseudonym}`);
    this.server.emit('message', `${pseudonym} has joined the chat`);
  }

  // Rejoindre une room dans un realm spécifique
  @SubscribeMessage('joinRealmRoom')
  handleJoinRealmRoom(
    @MessageBody() { realm, room }: { realm: string; room: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const fullRoom = `${realm}-${room}`; // Combinaison realm-room
    client.join(fullRoom);
    const pseudonym = this.users.get(client.id) || client.id;
    this.roomsService.addUserToRoom(realm, room, client.id);
    console.log(`Client ${pseudonym} joined realm ${realm} in room ${room}`);
    this.server
      .to(fullRoom)
      .emit(
        'message',
        `User ${pseudonym} has joined the room ${room} in realm ${realm}`,
      );
  }

  // Envoyer un message à une room spécifique dans un realm
  @SubscribeMessage('messageToRealmRoom')
  handleMessageToRealmRoom(
    @MessageBody()
    { realm, room, message }: { realm: string; room: string; message: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const fullRoom = `${realm}-${room}`;
    const pseudonym = this.users.get(client.id) || client.id;
    console.log(`Message from ${pseudonym} to room ${fullRoom}: ${message}`);
    this.server.to(fullRoom).emit('message', `${pseudonym}: ${message}`);
  }

  // Quitter une room dans un realm
  @SubscribeMessage('leaveRealmRoom')
  handleLeaveRealmRoom(
    @MessageBody() { realm, room }: { realm: string; room: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const fullRoom = `${realm}-${room}`;
    client.leave(fullRoom);
    const pseudonym = this.users.get(client.id) || client.id;
    this.roomsService.removeUserFromRoom(realm, room, client.id);
    console.log(`Client ${pseudonym} left room ${fullRoom}`);

    // Notify the user who left
    client.emit('message', `You have left the room ${room} in realm ${realm}`);

    this.server
      .to(fullRoom)
      .emit('message', `User ${pseudonym} has left the room in realm ${realm}`);
  }
}
