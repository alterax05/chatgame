import { WebSocket } from "ws";
import { ChatRoom, ChatRoomManager } from "./roomService";
import { Event, ServerEvent } from "../utils/socketUtils";
import { randomUUID } from "crypto";
import { User, AppEventData, UserData, Vote } from "../types/types";
import { Message } from "../types/types";
import { OpenAI } from "openai";
import { config } from "dotenv";
import { getRandomInt } from "../utils/utils";
import { get } from "http";

config();
class GameService {
  private usersList: User[];
  private matchMakingQueue: User[];
  private chatRoomManager: ChatRoomManager;
  private openAI;

  ROOM_SIZE = 3;

  constructor() {
    this.usersList = [];
    this.matchMakingQueue = [];
    this.chatRoomManager = new ChatRoomManager();
    this.openAI = new OpenAI({
      apiKey: process.env.PROJECT_ID,
      organization: process.env.ORG_ID,
    });
  }

  public getUserById(id: string) {
    return this.usersList.find((user) => user.id === id);
  }

  public findRoomById(id: string) {
    return this.chatRoomManager.findRoomById(id);
  }

  private getAIResponse(room: ChatRoom) {
    room.AIdata.hasAnswered = true;
    setTimeout(async () => {
      this.sendMessageToPlayers(
        room.AIdata.firstName,
        room.AIdata.id,
        room,
        "I'm ready to answer"
      );

      //TODO: Get AI response from OpenAI (now there seems to have a type error)
      /*const completion = await this.openAI.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant designed to output JSON.",
          },
          { role: "user", content: "Who won the world series in 2020?" },
        ],
        model: "gpt-3.5-turbo-0125",
        response_format: { type: "json_object" },
      }); */
    }, getRandomInt(1000, 5000));
  }

  public forwardMessageToRoomPlayers(
    user: User,
    room: ChatRoom,
    message: AppEventData
  ) {
    if (
      !message.data.text ||
      room.turnStatus.votingIsOpen ||
      room.gameStatus.finished
    )
      return;

    // allow only one message per turn for each player
    if (
      room.turnStatus.wroteMessages.find((msg) => msg.author.id === user.id)
    ) {
      return;
    }

    // the first message must be the one from the questioner
    if (
      room.turnStatus.wroteMessages.length == 0 &&
      user.id !== room.turnStatus.questioner?.id
    ) {
      return;
    }

    if (
      room.turnStatus.questioner?.id === user.id &&
      !room.AIdata.hasAnswered
    ) {
      this.getAIResponse(room);
    }

    this.sendMessageToPlayers(
      user.chatData!.firstName!,
      user.id,
      room,
      message.data.text
    );

    // check if we can pass to the voting phase
    if (room.turnStatus.wroteMessages.length === room.players.length + 1) {
      room.players.forEach((player) => {
        this.sendServerMessage(player.ws, "Voting phase is open!", {
          voting: true,
        });
      });
      room.turnStatus.votingIsOpen = true;
      this.sendTurnStatusToRoomPlayers(room);
      this.createVoteArray(room);
      this.makeAIVote(room);
    }
  }

  private makeAIVote(room: ChatRoom) {
    setTimeout(() => {
      this.votePlayerToEliminate(room.AIdata.id, room, room.players[0].id);
      console.log(
        `AI voted ${room.players[0].id} (${room.players[0].chatData?.firstName})`
      );
    }, getRandomInt(1000, 5000));
  }

  private sendMessageToPlayers(
    name: string,
    id: string,
    room: ChatRoom,
    message: string
  ) {
    const messageToSend = {
      id: randomUUID(),
      author: {
        id: id,
        firstName: name,
      },
      text: message,
    } as Message;

    room.turnStatus.wroteMessages.push(messageToSend);

    // forward message to all players in the room
    room.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          data: {
            message: messageToSend,
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
    const client = this.usersList.find((client) => client.id === clientId);
    if (
      !client ||
      this.matchMakingQueue.find((client) => client.id === clientId)
    )
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
          this.ROOM_SIZE - this.matchMakingQueue.length
        } more players`,
      },
    };

    this.matchMakingQueue.forEach((client) => {
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

  public createVoteArray(room: ChatRoom) {
    room.turnStatus.votes = room.players.map(
      (player) =>
        ({
          userID: player.id,
          vote: 0,
          hasVoted: false,
        } as Vote)
    );

    room.turnStatus.votes.push({
      userID: room.AIdata.id,
      vote: 0,
      hasVoted: false,
    } as Vote);
  }

  public sendGameStatusToRoomPlayers(room: ChatRoom) {
    const players = room.players;
    const playersData = players.map((user) => user.chatData);
    playersData.push(room.AIdata);

    players.forEach((client) => {
      client.ws.send(
        JSON.stringify(
          {
            event: ServerEvent.GameStatus,
            data: {
              players: playersData,
              user: client.chatData,
              ...room.gameStatus,
            },
          },
          (key, value) => (key === "ws" ? undefined : value) // remove ws from the object when serializing
        )
      );
    });
  }

  public greetPlayers(room: ChatRoom) {
    room.players.forEach((client) =>
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
    room.players.forEach((client) => {
      this.sendServerMessage(
        client.ws,
        `It's ${questioner.chatData?.firstName}'s turn to ask a question`
      );
    });
  }

  public sendServerMessage(ws: WebSocket, message: string, metadata?: any) {
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
            metadata,
          } as Message,
        },
        event: ServerEvent.NewMessage,
      } as AppEventData)
    );
  }

  public sendTurnStatusToRoomPlayers(room: ChatRoom) {
    const players = room.players;

    players.forEach((client) => {
      client.ws.send(
        JSON.stringify(
          {
            event: ServerEvent.TurnStatus,
            data: {
              ...room.turnStatus,
            },
          },
          (key, value) => (key === "ws" ? undefined : value) // remove ws from the object when serializing
        )
      );
    });
  }

  public disconnectClient(user: User, room?: ChatRoom) {
    let gameRoom =
      room ?? this.chatRoomManager.findRoomById(user.chatData?.roomId!);

    gameRoom?.players.forEach((client) => {
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
      (client) => client.id !== user.id
    );

    const necessaryPlayers = Math.max(
      this.ROOM_SIZE - this.matchMakingQueue.length,
      0
    );
    const matchmakingStatus = {
      event: ServerEvent.ConnectionStatus,
      data: {
        message: `Missing players. Waiting for ${necessaryPlayers} more players`,
      },
    };
    this.matchMakingQueue.forEach((client) => {
      client.ws.send(JSON.stringify(matchmakingStatus));
    });
  }

  public votePlayerToEliminate(
    userID: string,
    room: ChatRoom,
    votedClientId: string
  ) {
    if (!room.turnStatus.votingIsOpen || room.gameStatus.finished) return;

    const votingUser = room.turnStatus.votes.find(
      (votingUser) => votingUser.userID === userID
    );
    if (!votingUser || votingUser.hasVoted) return;
    votingUser.hasVoted = true;

    const votedUser = room.turnStatus.votes.find(
      (votedUser) => votedUser.userID === votedClientId
    );
    if (!votedUser) return;
    votedUser.vote++;

    const allVoted = room.turnStatus.votes.every(
      (votingUser) => votingUser.hasVoted
    );

    // if all players have voted, close voting phase
    if (allVoted) {
      room.turnStatus.votingIsOpen = false;
      const maxVotedPersonID = room.turnStatus.votes.reduce((a, b) =>
        a.vote > b.vote ? a : b
      ).userID;

      if (maxVotedPersonID === room.AIdata.id) {
        room.gameStatus.finished = true;
        room.players.forEach((client) =>
          this.sendServerMessage(
            client.ws,
            `The game has finished! ${room.AIdata.firstName} was the bot!`,
            {
              finished: true,
            }
          )
        );
        return;
      }

      const maxVotedPerson = room.players.find(
        (player) => player.id === maxVotedPersonID
      )!;
      room.players.forEach((client) =>
        this.sendServerMessage(
          client.ws,
          `${maxVotedPerson.chatData?.firstName} has been eliminated!`,
          { voting: false }
        )
      );
      room.gameStatus.eliminatedPlayers.push(maxVotedPerson);
      const index = room.players.indexOf(maxVotedPerson);
      room.players.splice(index, 1);
      this.nextTurn(room);
    }
  }

  public nextTurn(room: ChatRoom) {
    room.gameStatus.turnNumber++;
    room.turnStatus.votes = [];
    room.turnStatus.wroteMessages = [];
    room.AIdata.hasAnswered = false;
    // check if in the room there is only one player (the game has ended)
    if (room.players.length <= 1) {
      room.gameStatus.finished = true;
      room.players.forEach((client) =>
        this.sendServerMessage(
          client.ws,
          "The game has finished! You lost :(",
          {
            finished: true,
          }
        )
      );
    } else {
      this.changeQuestioner(room);
    }
    this.sendTurnStatusToRoomPlayers(room);
    this.sendGameStatusToRoomPlayers(room);
  }
}

export default GameService;
