import { Client } from "./socket";

export interface User extends Client {
  firstName: string;
  room: string;
  votes: number;
  hasVoted: boolean;
}

export interface Message {
  id: string;
  author: User;
  text: string;
  metadata: any;
}
