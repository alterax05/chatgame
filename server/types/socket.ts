import { WebSocket } from "ws";
import { messageScheme } from "../utils/socketUtils";

export interface Client {
  id: string;
  ws: WebSocket;
  room: string;
  failedPings: number;
  votes: number;
  hasVoted: boolean;
}

export type ClientMessage = typeof messageScheme._output;
