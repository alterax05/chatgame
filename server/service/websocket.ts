import { WebSocket } from "ws";
import { ChatRoom, ChatRoomManager } from "./room";
import { Event, ServerEvent } from "../utils/socketUtils";
import { randomUUID } from "crypto";
import { User, AppEventData, UserData } from "../types/types";

class WebSocketService {
  private usersList: User[];
  private matchMakingQueue: User[];
  private chatRoomManager: ChatRoomManager;

  ROOM_SIZE = 3;

  constructor() {
    this.usersList = [];
    this.matchMakingQueue = [];
    this.chatRoomManager = new ChatRoomManager();
  }

  public forwardMessageToRoomPlayers(clientId: string, message: AppEventData) {
    if (!message.data.text) return;

    const user = this.usersList.find(client => client.id === clientId);
    if (!user || !user.chatData?.roomId) return;

    const room = this.chatRoomManager.findRoomById(user?.chatData?.roomId);
    if (!room) return;

    // TODO: do turn logic here

    const players = room.getPlayers();

    players.forEach(player => {
      player.ws.send(
        JSON.stringify({
          data: {
            message: {
              id: randomUUID(),
              author: {
                id: user.id,
                firstName: user.chatData?.firstName,
              },
              text: message.data.text,
            },
          },
          event: ServerEvent.NewMessage,
        })
      );
    });
  }

  public registerClient(ws: WebSocket) {
    const newClient: User = {
      id: randomUUID(),
      ws,
      failedPings: 0,
    };
    this.usersList.push(newClient);

    return newClient;
  }

  public addPlayerInMatchMaking(clientId: string, firstName: string) {
    const client = this.usersList.find(client => client.id === clientId);
    if (!client || this.matchMakingQueue.find(client => client.id === clientId))
      return;

    const user: User = {
      ...client,
      chatData: {
        id: clientId,
        firstName,
      },
    };
    // add player in the matchmaking queue
    this.matchMakingQueue.push(user);

    if (this.matchMakingQueue.length >= this.ROOM_SIZE - 1) {
      this.startNewChatRoom();
    } else {
      this.sendMatchmakingStatusUpdate();
    }
  }

  public sendMatchmakingStatusUpdate() {
    const matchMakingStatus = {
      from: "Server",
      event: ServerEvent.ConnectionStatus,
      data: {
        message: `Missing players. Waiting for ${
          this.ROOM_SIZE - this.matchMakingQueue.length - 1
        } more players`,
      },
    };

    this.matchMakingQueue.forEach(client => {
      client.ws.send(JSON.stringify(matchMakingStatus));
    });
  }

  public startNewChatRoom() {
    const players = this.matchMakingQueue.splice(0, this.ROOM_SIZE - 1);
    const room = this.chatRoomManager.createRoom(players);

    room.gameStatus.started = true;
    room.gameStatus.turnNumber = 1;

    this.sendGameStatusToRoomPlayers(room);

    // greet players and tell them the rules of the game
    setTimeout(() => this.greetPlayers(room), 1500);
    // set first questioner
    setTimeout(() => this.changeQuestioner(room), 3000);
  }

  public sendGameStatusToRoomPlayers(room: ChatRoom) {
    const players = room.getPlayers();
    const playersData = players.map(user => user.chatData);

    players.forEach(client => {
      client.ws.send(
        JSON.stringify({
          event: ServerEvent.GameStatus,
          data: {
            players: playersData,
            started: room.gameStatus.started,
            user: client.chatData,
            turnNumber: room.gameStatus.turnNumber,
          },
        })
      );
    });
  }

  public greetPlayers(room: ChatRoom) {
    room
      .getPlayers()
      .forEach(client =>
        this.sendServerMessage(
          client.ws,
          "Welcome to the game! Your goal is to find which player is a bot. Each turn a designated player will make a question. The other players will then answers in the more appropriate way."
        )
      );
  }

  public changeQuestioner(room: ChatRoom) {
    const questioner = room.setQuestioner();

    this.sendTurnStatusToRoomPlayers(room);

    // notify players of who is the questioner
    room.getPlayers().forEach(client => {
      this.sendServerMessage(
        client.ws,
        `It's ${questioner.chatData?.firstName}'s turn to ask a question`
      );
    });
  }

  public sendServerMessage(ws: WebSocket, message: string) {
    ws.send(
      JSON.stringify({
        data: {
          message: {
            id: randomUUID(),
            author: {
              id: "Server",
              firstName: "Server",
            },
            text: message,
          },
        },
        event: ServerEvent.NewMessage,
      })
    );
  }

  public sendTurnStatusToRoomPlayers(room: ChatRoom) {
    const players = room.getPlayers();
  }

  public disconnectClient(clientId: string) {
    const user = this.usersList.find(client => client.id === clientId);
    const room = this.chatRoomManager.findChatroomFromUser(clientId);

    room?.getPlayers().forEach(client => {
      client.ws.send(
        JSON.stringify({
          event: ServerEvent.NewMessage,
          data: {
            message: {
              id: randomUUID(),
              author: {
                id: "Server",
                firstName: "Server",
              },
              text: `${user?.chatData?.firstName} disconnected from chat`,
            },
          },
        })
      );
    });

    this.matchMakingQueue = this.matchMakingQueue.filter(
      client => client.id !== clientId
    );

    const necessaryPlayers = Math.min(
      this.ROOM_SIZE - this.matchMakingQueue.length,
      0
    );
    const matchmakingStatus = {
      event: ServerEvent.ConnectionStatus,
      data: {
        message: `Missing players. Waiting for ${necessaryPlayers} more players`,
      },
    };
    this.matchMakingQueue.forEach(client => {
      client.ws.send(JSON.stringify(matchmakingStatus));
    });
  }

  public votePlayerToEliminate(clientId: string, votedClientId: string) {
    const user = this.usersList.find(client => client.id === clientId);
    if (!user?.chatData?.roomId) return;

    const room = this.chatRoomManager.findRoomById(user.chatData.roomId);
    if (!room) return;

    room.vote(clientId, votedClientId);
  }

  public getClient(id: string) {
    return this.usersList.find(client => client.id === id);
  }
}

export default WebSocketService;
