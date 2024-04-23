import { User } from "../types/types";
import { fakerIT as faker } from "@faker-js/faker";
class ChatRoom {
    public readonly id: string;
    private users: User[];

    constructor(clients: User[]) {
        this.id = `${faker.word.adjective()}-${faker.word.noun()}-${Math.floor(Math.random() * 1000) + 1}`;
        this.users = clients;
        this.users.forEach(user => user.room = this.id);
    }

    removeUser(user: User) {
        const index = this.users.indexOf(user);
        if (index !== -1) {
            this.users.splice(index, 1);
        }
    }

    getUsers() {
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

        votedUser.votes++;
        user.hasVoted = true;     
    }

    hasEveryoneVoted() {
        return this.users.every(user => user.hasVoted);
    }

    resetVotes() {
        this.users.forEach(user => user.votes = 0);
        this.users.forEach(user => user.hasVoted = false);
    }

    // TODO: check behaviour if two users have the same vote count
    getMaxVotedUser() {
        const max = Math.max(...this.users.map(user => user.votes));
        return this.users.find(user => user.votes === max);
    }
}
class ChatRoomManager {
    private rooms: ChatRoom[];

    constructor() {
        this.rooms = [];
    }

    createRoom(users: User[]) {
        const room = new ChatRoom(users);
        this.rooms.push(room);
        return room;
    }

    getRoomByName(name: string) {
        return this.rooms.find(room => room.getId() === name);
    }

    removeRoom(name: string) {
        const index = this.rooms.findIndex(room => room.getId() === name);
        if (index !== -1) {
            this.rooms.splice(index, 1);
        }
    }

    getAllRooms() {
        return this.rooms;
    }

    findUserInChatrooms(userId: string): User | undefined {
        for (const room of this.getAllRooms()) {
          const users = room.getUsers();
          const foundUser = users.find((user) => user.id === userId);
          if (foundUser) {
            return foundUser;
          }
        }
        return undefined;
    }

    findChatroomFromUser(userId: string): ChatRoom | undefined{
        for (const room of this.getAllRooms()) {
          const users = room.getUsers();
          const foundUser = users.find((user) => user.id === userId);
          if (foundUser) {
            return room;
          }
        }
        return undefined;
    }

    removeUser(userId: string) {
        let user: User | undefined;

        for(const room of this.getAllRooms()) {
            const users = room.getUsers();
            const foundUser = users.find((user) => user.id === userId);
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

export {ChatRoom, ChatRoomManager}