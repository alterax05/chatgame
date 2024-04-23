import { WebSocket } from "ws";
import { Client, ClientMessage } from "../types/socket";
import { ChatRoomManager } from "./room";
import { ServerEvent } from "../utils/socketUtils";
import { randomUUID } from "crypto";
import { User } from "../types/types";

class WebSocketService {
  private waitingRoom: Client[];
  private matchMakingQueue: User[];
  private chatRoomManager: ChatRoomManager;

  constructor() {
    this.waitingRoom = [];
    this.matchMakingQueue = [];
    this.chatRoomManager = new ChatRoomManager();
  }
  public forwardMessage(message: ClientMessage) {
    const room = this.chatRoomManager.findChatroomFromUser(message.from);
    if (!room) return;
    const players = room.getUsers();
    players.forEach((player) => {
      player.ws.send(JSON.stringify(message));
    });
  }

  public createClient(ws: WebSocket) {
    const newClient: Client = {
      id: randomUUID(),
      ws,
      failedPings: 0
    };

    this.waitingRoom.push(newClient);
    return newClient;
  }

  public matchClient(id: string, firstName: string) {
    const client = this.waitingRoom.find((client) => client.id === id);
    if (!client) return;

    const user: User = {
      ...client,
      firstName,
      room: "waitingRoom",
      votes: 0,
      hasVoted: false
    }

    this.matchMakingQueue.push(user);

    if(this.matchMakingQueue.length >= 4){
      const room = this.chatRoomManager.createRoom(this.matchMakingQueue.splice(0, 4));
      const message = { from: "server", event: ServerEvent.ConnectionStatus, data: { message: `Game started in room ${room.getId()}`}} as ClientMessage;
      room.getUsers().forEach((client) => {
        client.ws.send(JSON.stringify(message));
      });
    }
    else{
      const message = { from: "server", event: ServerEvent.ConnectionStatus, data: { message: `Missing players. Waiting for ${4 - this.matchMakingQueue.length} more players`}} as ClientMessage;
      this.matchMakingQueue.forEach((client) =>{
        client.ws.send(JSON.stringify(message));
      });
    }
  }

  public removeClient(id: string) {
    this.chatRoomManager.removeUser(id);
  }

  public vote(id: string, votedClient: string) {
    const room = this.chatRoomManager.findChatroomFromUser(id);
    if (!room) return;
    room.vote(id, votedClient);
  }

  public getClient(id: string) {
    return this.waitingRoom.find((client) => client.id === id);
  }
}

export default WebSocketService;
