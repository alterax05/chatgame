import { randomUUID } from "crypto";
import type {
  ChatRoom,
  GameStatus,
  TurnStatus,
  User,
  UserData,
} from "../types/types";
import { fakerIT as faker } from "@faker-js/faker";

class RoomService {
  private rooms: ChatRoom[];

  constructor() {
    this.rooms = [];
  }

  findRoomById(id: string) {
    return this.rooms.find((room) => room.id === id);
  }

  createRoom(users: User[]) {
    const idRoom = randomUUID();
    const room: ChatRoom = {
      id: idRoom,
      players: users,
      AIdata: {
        hasAnswered: false,
        firstName: faker.person.firstName(),
        id: randomUUID(),
        roomId: idRoom,
      },
      turnStatus: {
        wroteMessages: [],
        votes: [],
        votingIsOpen: false,
      },
      gameStatus: {
        started: false,
        turnNumber: 0,
        eliminatedPlayers: [],
        finished: false,
      },
    };

    this.rooms.push(room);
    users.forEach((user) => {
      user.chatData!.roomId = room.id;
    });

    return room;
  }

  removeRoom(id: string) {
    let room: ChatRoom | undefined;

    const index = this.rooms.findIndex((room) => room.id === id);
    if (index !== -1) {
      const deletedRooms = this.rooms.splice(index, 1);
      room = deletedRooms[0];
      room.players.forEach((player) => {
        player.chatData!.roomId = undefined;
      });
    }

    return room;
  }

  getAllRooms() {
    return this.rooms;
  }

  removeUser(userId: string) {
    let user: User | undefined;

    for (const room of this.getAllRooms()) {
      const foundUser = room.players.find((user) => user.id === userId);
      if (foundUser) {
        user = foundUser;
        room.players = room.players.filter((player) => player.id !== userId);
        if (room.players.length === 0) {
          this.removeRoom(room.id);
        }
      }
    }

    return user;
  }

  changeQuestioner(room: ChatRoom) {
    const questionerIndex =
      room.gameStatus.turnNumber % (room.players.length + 1);

    if (questionerIndex === room.players.length) {
      const aiData = {
        firstName: room.AIdata.firstName,
        id: room.AIdata.id,
        roomId: room.AIdata.roomId,
      };
      room.turnStatus.questioner = aiData;
    } else {
      room.turnStatus.questioner = room.players[questionerIndex].chatData!;
    }

    return room.turnStatus.questioner;
  }
}

export { type ChatRoom, RoomService as ChatRoomManager };
