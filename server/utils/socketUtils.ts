import type { RawData } from "ws";
import z from "zod";
import type { AppEventData } from "../types/types";

export enum Event {
  Connect = "connect",
  Disconnect = "disconnect",
  SendMessage = "sendMessage",
  Vote = "vote",
}

export enum ServerEvent {
  ConnectionStatus = "connectionStatus",
  GameStatus = "gameStatus",
  TurnStatus = "turnStatus",
  NewMessage = "newMessage",
}

export const messageScheme = z.object({
  from: z.string().optional(),
  event: z.string(),
  data: z.object({
    firstName: z.string().optional(),
    vote: z.string().optional(),
    text: z.string().optional(),
  }),
});

class SocketUtils {
  static parseMessage(message: RawData, id: string) {
    try {
      const json = JSON.parse(message.toString());
      const messageData = messageScheme.parse(json);
      messageData.from = id;
      return messageData as AppEventData;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

export default SocketUtils;
