import { WebSocket } from "ws";
import { messageScheme } from "../utils/socketUtils";
import { loginScheme } from "../utils/clientUtils";

export interface User {
  ws: WebSocket;
  failedPings: number;
  id: string;
  chatData?: UserData;
}

export interface UserData {
  id: string;
  firstName: string;
  roomId?: string;
}

export interface ChatRoom {
  id: string;
  players: User[];
  turnStatus: TurnStatus;
  gameStatus: GameStatus;
  AIdata: AIData;
}

export interface TurnStatus {
  questioner?: UserData;
  wroteMessages: Message[];
  votes: Vote[];
  votingIsOpen: boolean;
}

export interface AIData extends UserData {
  hasAnswered: boolean;
}

export interface Vote {
  userID: string;
  vote: number;
  hasVoted: boolean;
}

export interface GameStatus {
  started: boolean;
  turnNumber: number;
  eliminatedPlayers: User[];
  finished: boolean;
}

export interface Message {
  id: string;
  author: UserData;
  text: string;
  metadata?: any;
}

export type AppEventData = typeof messageScheme._output;

export type LoginInfo = typeof loginScheme._output;
