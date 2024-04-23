import { WebSocket } from "ws";
import { Client, ClientMessage } from "../types/socket";
import { ChatRoomManager } from "./room";
import { Event, ServerEvent } from "../utils/socketUtils";
import { randomUUID } from "crypto";
import { User } from "../types/types";

class WebSocketService {
  private waitingRoom: Client[];
  private matchMakingQueue: User[];
  private chatRoomManager: ChatRoomManager;

  ROOM_SIZE = 3;

  constructor() {
    this.waitingRoom = [];
    this.matchMakingQueue = [];
    this.chatRoomManager = new ChatRoomManager();
  }
  public forwardMessage(message: ClientMessage) {
    if (!message.from) return;

    const room = this.chatRoomManager.findChatroomFromUser(message.from);
    const user = this.chatRoomManager.findUserInChatrooms(message.from);

    if (!room || !user) return;
    const players = room.getUsers();

    players.forEach(player => {
      player.ws.send(
        JSON.stringify({
          data: {
            message: {
              id: randomUUID(),
              author: {
                id: user.id,
                firstName: user.firstName,
              },
              text: message.data.text,
            },
          },
          event: ServerEvent.NewMessage,
        })
      );
    });
  }

  public createClient(ws: WebSocket) {
    const newClient: Client = {
      id: randomUUID(),
      ws,
      failedPings: 0,
    };

    this.waitingRoom.push(newClient);
    return newClient;
  }

  public matchClient(id: string, firstName: string) {
    const client = this.waitingRoom.find(client => client.id === id);
    if (!client || this.matchMakingQueue.find(client => client.id === id))
      return;

    const user: User = {
      ...client,
      firstName,
      room: "waitingRoom",
      votes: 0,
      hasVoted: false,
    };

    this.matchMakingQueue.push(user);

    if (this.matchMakingQueue.length >= this.ROOM_SIZE - 1) {
      const room = this.chatRoomManager.createRoom(
        this.matchMakingQueue.splice(0, this.ROOM_SIZE - 1)
      );

      const connectionStatusEvent = {
        event: ServerEvent.ConnectionStatus,
        data: { message: `Game started in room ${room.getId()}` },
      };

      room.getUsers().forEach(client => {
        client.ws.send(JSON.stringify(connectionStatusEvent));
        client.ws.send(
          JSON.stringify({
            event: ServerEvent.GameStatus,
            data: {
              players: room.getUsers().map(user => user.firstName),
              started: true,
              user: {
                id: client.id,
                firstName: client.firstName,
              },
            },
          })
        );
        client.ws.send(
          JSON.stringify({
            data: {
              message: {
                id: randomUUID(),
                author: {
                  id: "server",
                  firstName: "Server",
                },
                text: "Welcome to the game! Your goal is...",
              },
            },
            event: ServerEvent.NewMessage,
          })
        );
      });
    } else {
      const message = {
        from: "server",
        event: ServerEvent.ConnectionStatus,
        data: {
          message: `Missing players. Waiting for ${
            this.ROOM_SIZE - this.matchMakingQueue.length - 1
          } more players`,
        },
      };

      this.matchMakingQueue.forEach(client => {
        client.ws.send(JSON.stringify(message));
      });
    }
  }

  public removeClient(id: string) {
    const room = this.chatRoomManager.findChatroomFromUser(id);
    const user = this.chatRoomManager.removeUser(id);

    room?.getUsers().forEach(client => {
      client.ws.send(
        JSON.stringify({
          from: "server",
          event: Event.SendMessage,
          data: { message: `${user?.firstName} disconnected from chat` },
        } as ClientMessage)
      );
    });

    this.matchMakingQueue = this.matchMakingQueue.filter(
      client => client.id !== id
    );
    this.matchMakingQueue.forEach(client => {
      client.ws.send(
        JSON.stringify({
          event: ServerEvent.ConnectionStatus,
          data: {
            message: `Missing players. Waiting for ${
              4 - this.matchMakingQueue.length
            } more players`,
          },
        })
      );
    });
  }

  public vote(id: string, votedClient: string) {
    const room = this.chatRoomManager.findChatroomFromUser(id);
    if (!room) return;
    room.vote(id, votedClient);
  }

  public getClient(id: string) {
    return this.waitingRoom.find(client => client.id === id);
  }
}

export default WebSocketService;
