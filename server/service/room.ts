import { User } from "../types/types";
import { fakerIT as faker } from "@faker-js/faker";

interface TurnStatus {
  questioner?: User;
  wroteMessages: User[];
}

interface GameStatus {
  started: boolean;
  turnNumber: number;
}

class ChatRoom {
  public readonly id: string;

  private users: User[];
  private eliminatedUsers: User[] = [];
  public turnStatus: TurnStatus;
  public gameStatus: GameStatus;

  constructor(clients: User[]) {
    this.id = `${faker.word.adjective()}-${faker.word.noun()}-${
      Math.floor(Math.random() * 1000) + 1
    }`;
    this.users = clients;

    this.turnStatus = {
      wroteMessages: [],
    };
    this.gameStatus = {
      started: false,
      turnNumber: 0,
    };
  }

  removeUser(user: User) {
    const index = this.users.indexOf(user);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }

  getPlayers() {
    return this.users;
  }

  getId() {
    return this.id;
  }

  count() {
    return this.users.length;
  }

  vote(userId: string, votedClientId: string) {
    const user = this.users.find(user => user.id === userId);
    if (!user) return;

    const votedUser = this.users.find(user => user.id === votedClientId);
    if (!votedUser) return;

    // votedUser.votes++;
    // user.hasVoted = true;
  }

  hasEveryoneVoted() {
    // return this.users.every(user => user.hasVoted);
  }

  resetVotes() {
    // this.users.forEach(user => (user.votes = 0));
    // this.users.forEach(user => (user.hasVoted = false));
  }

  // TODO: check behaviour if two users have the same vote count
  getMaxVotedUser() {
    // const max = Math.max(...this.users.map(user => user.votes));
    // return this.users.find(user => user.votes === max);
  }

  public setQuestioner() {
    const randomIndex = Math.floor(Math.random() * this.users.length);
    return this.users[randomIndex];
  }
}

class ChatRoomManager {
  private rooms: ChatRoom[];

  constructor() {
    this.rooms = [];
  }

  findRoomById(id: string) {
    return this.rooms.find(room => room.getId() === id);
  }

  createRoom(users: User[]) {
    const room = new ChatRoom(users);
    this.rooms.push(room);
    users.forEach(user => {
      user.chatData!.roomId = room.getId();
    });

    return room;
  }

  removeRoom(id: string) {
    const index = this.rooms.findIndex(room => room.getId() === id);
    if (index !== -1) {
      const deletedRooms = this.rooms.splice(index, 1);
      deletedRooms.forEach(room => {
        room.getPlayers().forEach(player => {
          player.chatData!.roomId = undefined;
        });
      });
    }
  }

  getAllRooms() {
    return this.rooms;
  }

  removeUser(userId: string) {
    let user: User | undefined;

    for (const room of this.getAllRooms()) {
      const users = room.getPlayers();
      const foundUser = users.find(user => user.id === userId);
      console.log(foundUser);
      if (foundUser) {
        user = foundUser;
        room.removeUser(foundUser);
        if (room.count() === 0) {
          this.removeRoom(room.getId());
        }
      }
    }

    return user;
  }
}

export { ChatRoom, ChatRoomManager };
