import { WebSocket } from "ws";
import { messageScheme } from "../utils/socketUtils";

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
}

export interface TurnStatus {
  questioner?: User;
  wroteMessages: Message[];
}

export interface GameStatus {
  started: boolean;
  turnNumber: number;
  eliminatedPlayers: User[];
}

export interface Message {
  id: string;
  author: UserData;
  text: string;
  metadata?: any;
}

export type AppEventData = typeof messageScheme._output;
