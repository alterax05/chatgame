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
}

export type AppEventData = typeof messageScheme._output;

export interface Message {
  id: string;
  author: UserData;
  text: string;
  metadata: any;
}
