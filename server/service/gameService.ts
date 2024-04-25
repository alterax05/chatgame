import { WebSocket } from "ws";
import { ChatRoom, ChatRoomManager } from "./roomService";
import { Event, ServerEvent } from "../utils/socketUtils";
import { randomUUID } from "crypto";
import { User, AppEventData, UserData } from "../types/types";

class GameService {
  private usersList: User[];
  private matchMakingQueue: User[];
  private chatRoomManager: ChatRoomManager;

  ROOM_SIZE = 2;

  constructor() {
    this.usersList = [];
    this.matchMakingQueue = [];
    this.chatRoomManager = new ChatRoomManager();
  }

  public getUserById(id: string) {
    return this.usersList.find(user => user.id === id);
  }

  public findRoomById(id: string) {
    return this.chatRoomManager.findRoomById(id);
  }

  public forwardMessageToRoomPlayers(
    user: User,
    room: ChatRoom,
    message: AppEventData
  ) {
    if (!message.data.text) return;

    // TODO: handle turn logics here

    // allow only one message per turn for each player
    if (room.turnStatus.wroteMessages.find(msg => msg.author.id === user.id)) {
      return;
    }

    // the first message must be the one from the questioner
    if (
      room.turnStatus.wroteMessages.length == 0 &&
      user.id !== room.turnStatus.questioner?.id
    ) {
      return;
    }

    const messageToSend = {
      id: randomUUID(),
      author: {
        id: user.id,
        firstName: user.chatData!.firstName!,
      },
      text: message.data.text,
    };

    room.turnStatus.wroteMessages.push(messageToSend);

    // forward message to all players in the room
    room.players.forEach(player => {
      player.ws.send(
        JSON.stringify({
          data: {
            message: messageToSend,
          },
          event: ServerEvent.NewMessage,
        })
      );
    });

    // check if we can pass to the voting phase
    if (room.turnStatus.wroteMessages.length === room.players.length) {
      // TODO: implement voting phase
    }
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

    client.chatData = {
      id: clientId,
      firstName,
    };

    // add player in the matchmaking queue
    this.matchMakingQueue.push(client);

    if (this.matchMakingQueue.length >= this.ROOM_SIZE) {
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
    const players = this.matchMakingQueue.splice(0, this.ROOM_SIZE);

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
    const players = room.players;
    const playersData = players.map(user => user.chatData);

    players.forEach(client => {
      client.ws.send(
        JSON.stringify({
          event: ServerEvent.GameStatus,
          data: {
            players: playersData,
            user: client.chatData,
            ...room.gameStatus,
          },
        })
      );
    });
  }

  public greetPlayers(room: ChatRoom) {
    room.players.forEach(client =>
      this.sendServerMessage(
        client.ws,
        "Welcome to the game! Your goal is to find which player is a bot. Each turn a designated player will make a question. The other players will then answers in the more appropriate way."
      )
    );
  }

  public changeQuestioner(room: ChatRoom) {
    const questioner = this.chatRoomManager.changeQuestioner(room);

    this.sendTurnStatusToRoomPlayers(room);

    // notify players of who is the questioner
    room.players.forEach(client => {
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
    const players = room.players;

    players.forEach(client => {
      client.ws.send(
        JSON.stringify({
          event: ServerEvent.TurnStatus,
          data: {
            ...room.turnStatus,
          },
        })
      );
    });
  }

  public disconnectClient(user: User, room?: ChatRoom) {
    let gameRoom =
      room ?? this.chatRoomManager.findRoomById(user.chatData?.roomId!);

    gameRoom?.players.forEach(client => {
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
      client => client.id !== user.id
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

  public votePlayerToEliminate(
    user: User,
    room: ChatRoom,
    votedClientId: string
  ) {}
}

export default GameService;
