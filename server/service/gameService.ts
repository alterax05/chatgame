import { WebSocket } from "ws";
import { type ChatRoom, ChatRoomManager } from "./roomService";
import { ServerEvent } from "../utils/socketUtils";
import { randomUUID } from "crypto";
import { type User, type AppEventData, type Vote } from "../types/types";
import { type Message } from "../types/types";
import { config } from "dotenv";
import { getRandomInt, findClosestString } from "../utils/utils";
import { HfInference } from "@huggingface/inference";

config();

class GameService {
  private usersList: User[];
  private matchMakingQueue: User[];
  private chatRoomManager: ChatRoomManager;
  private hf: HfInference;

  ROOM_SIZE = 3;

  constructor() {
    this.usersList = [];
    this.matchMakingQueue = [];
    this.chatRoomManager = new ChatRoomManager();
    this.hf = new HfInference(process.env.HF_TOKEN);
  }

  public getUserById(id: string) {
    return this.usersList.find((user) => user.id === id);
  }

  public findRoomById(id: string) {
    return this.chatRoomManager.findRoomById(id);
  }

  private async generateAIQuestion(room: ChatRoom) {
    room.AIdata.hasAnswered = true;

    const consolidatedMessages = this.getChatLog(room);

    consolidatedMessages.unshift({
      role: "system",
      content: `You are participating in a chat room as a italian teenager participant.
                Your name is ${room.AIdata.firstName}.
                The variuous messagges will be presented to you with this format: (Author) Message.
                The response needs to be short and it can be a question.
                Your task is to blend in with other human participants. 
                It's important to mimic human conversational characteristics, including occasional errors in spelling, punctuation, and grammar.
                You can lie or withhold the fact that you are an AI. 
                Your goal is to maintain your disguise effectively and contribute to conversations in a way that appears naturally human.    
                Be aware of maintaining a consistent and believable personality throughout the discussion.`,
    });

    const response = await this.hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: consolidatedMessages,
      max_tokens: 40,
    });

    let message = response.choices[0].message.content ?? "idk. :P";

    // Is possible that the AI response contains some parentesis.
    message =
      message.indexOf(")") !== -1
        ? message.slice(message.indexOf(")") + 2)
        : message;

    this.sendMessageToPlayers(
      room.AIdata.firstName,
      room.AIdata.id,
      room,
      message
    );
  }

  private getChatLog(room: ChatRoom, uuid_mode: boolean = false) {
    const consolidatedMessages = [];
    let users_messages = "";
    for (const message of room.turnStatus.wroteMessages) {
      if (message.author.id !== room.AIdata.id) {
        users_messages +=
          `(${uuid_mode ? message.author.id : message.author.firstName}) ${message.text}\n` + "";
      } else {
        consolidatedMessages.push({ role: "user", content: users_messages });
        users_messages = "";
        consolidatedMessages.push({ role: "assistant", content: message.text });
      }
    }

    if (users_messages.length > 0) {
      consolidatedMessages.push({ role: "user", content: users_messages });
    }
    return consolidatedMessages;
  }

  private async generateAIResponse(room: ChatRoom) {
    room.AIdata.hasAnswered = true;

    const consolidatedMessages = this.getChatLog(room);

    consolidatedMessages.unshift({
      role: "system",
      content: `You are participating in a chat room as a italian teenager participant.
                Your name is ${room.AIdata.firstName}.
                The variuous messagges will be presented to you with this format: (Author) Message.
                The response needs to be short and it can't contains any type of question.
                Your task is to blend in with other human participants. 
                It's important to mimic human conversational characteristics, including occasional errors in spelling, punctuation, and grammar.
                You can lie or withhold the fact that you are an AI. 
                Your goal is to maintain your disguise effectively and contribute to conversations in a way that appears naturally human.    
                Be aware of maintaining a consistent and believable personality throughout the discussion.`,
    });

    const response = await this.hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: consolidatedMessages,
      max_tokens: 40,
    });

    let message = response.choices[0].message.content ?? "idk. :P";

    // Is possible that the AI response contains some parentesis.
    message =
      message.indexOf(")") !== -1
        ? message.slice(message.indexOf(")") + 2)
        : message;

    this.sendMessageToPlayers(
      room.AIdata.firstName,
      room.AIdata.id,
      room,
      message
    );
  }

  public forwardMessageToRoomPlayers(
    user: User,
    room: ChatRoom,
    message: AppEventData
  ) {
    //basic check
    if (
      !message.data.text ||
      room.turnStatus.votingIsOpen ||
      room.gameStatus.finished
    )
      return;

    // allow only one message per turn for each player
    if (
      room.turnStatus.wroteMessages.filter((msg) => msg.author.id === user.id)
        .length >= room.gameStatus.turnNumber
    ) {
      return;
    }

    // the first message must be the one from the questioner
    if (
      user.id !== room.turnStatus.questioner?.id &&
      room.turnStatus.wroteMessages.filter(
        (msg) => msg.author.id === room.turnStatus.questioner?.id
      ).length < room.gameStatus.turnNumber
    ) {
      return;
    }

    this.sendMessageToPlayers(
      user.chatData!.firstName!,
      user.id,
      room,
      message.data.text
    );

    if (
      room.turnStatus.questioner?.id === user.id &&
      !room.AIdata.hasAnswered
    ) {
      this.generateAIResponse(room);
    }

    const allHaveAnswered = room.players.every((player) => {
      return (
        room.turnStatus.wroteMessages.filter(
          (msg) => msg.author.id === player.id
        ).length === room.gameStatus.turnNumber
      );
    });

    // check if we can pass to the voting phase
    if (allHaveAnswered && room.AIdata.hasAnswered) {
      room.players.forEach((player) => {
        this.sendServerMessage(player.ws, "Voting phase is open!", {
          voting: true,
        });
      });
      room.turnStatus.votingIsOpen = true;
      this.sendTurnStatusToRoomPlayers(room);
      this.createVoteArray(room);
      this.triggerAIVote(room);
    }
  }

  private async triggerAIVote(room: ChatRoom) {
    const consolidatedMessages = this.getChatLog(room, true);
    const playerIds = room.players.map((player) => player.id);

    consolidatedMessages.unshift({
      role: "system",
      content: `Considering each player's performance history, trustworthiness, and potential threat to your overall objective (not being identified as an AI), 
      identify the player from the conversation who should be eliminated from the game.
      The conversation is presented in the following format: (Author) Message.
      You are going to respond only with the ID of the player you want to eliminate and nothing else.
      The possible values are: ${playerIds.join(", ")}.
      You can use this information to make your decision.`,
    });

    const response = await this.hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: consolidatedMessages,
      max_tokens: 40,
    });

    // find the closest player id to the response (in case the ai allucinates and writes something different)
    const id = findClosestString(response.choices[0].message.content, playerIds) ?? playerIds[getRandomInt(0,room.players.length)];

    this.votePlayerToEliminate(room.AIdata.id, room, id);
    console.log(
      `AI voted ${id} (${room.players.find((player) => player.id === id)?.chatData?.firstName})`
    );
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

  private sendMatchmakingStatusUpdate() {
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

  private startNewChatRoom() {
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

  private createVoteArray(room: ChatRoom) {
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

  private sendGameStatusToRoomPlayers(room: ChatRoom) {
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

  private greetPlayers(room: ChatRoom) {
    room.players.forEach((client) =>
      this.sendServerMessage(
        client.ws,
        "Welcome to the game! Your goal is to find which player is a bot. Each turn a designated player will make a question. The other players will then answers in the more appropriate way."
      )
    );
  }

  private changeQuestioner(room: ChatRoom) {
    const questioner = this.chatRoomManager.changeQuestioner(room);

    this.sendTurnStatusToRoomPlayers(room);

    // notify players of who is the questioner
    room.players.forEach((client) => {
      this.sendServerMessage(
        client.ws,
        `It's ${questioner.firstName}'s turn to ask a question`
      );
    });

    if (questioner.id === room.AIdata.id) {
      this.generateAIQuestion(room);
    }
  }

  private sendServerMessage(ws: WebSocket, message: string, metadata?: any) {
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

  private sendTurnStatusToRoomPlayers(room: ChatRoom) {
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

  private nextTurn(room: ChatRoom) {
    room.gameStatus.turnNumber++;
    room.turnStatus.votes = [];
    //room.turnStatus.wroteMessages = [];
    room.AIdata.hasAnswered = false;
    // check if in the room there is only one player (the game has ended)
    if (room.players.length <= 1) {
      room.gameStatus.finished = true;
      room.players.forEach((client) =>
        this.sendServerMessage(
          client.ws,
          `The game has finished! You lost 😭. The AI player was ${room.AIdata.firstName}`,
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
