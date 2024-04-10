import { WebSocket } from "ws";
import { messageScheme } from "../utils/socketUtils";

export interface Client {
  id: string;
  ws: WebSocket;
  subscriptions: string[];
  failedPings: number;
}

export type ClientMessage = typeof messageScheme._output;
