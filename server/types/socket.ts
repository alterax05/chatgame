import { WebSocket } from "ws";
import { messageScheme } from "../utils/socketUtils";

export interface Client {
  ws: WebSocket;
  failedPings: number;
  id: string;
}

export type ClientMessage = typeof messageScheme._output;
