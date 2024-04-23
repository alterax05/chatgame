import { RawData } from "ws";
import { ClientMessage } from "../types/socket";
import z from "zod";

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
  VoteStatus = "voteStatus",
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
      return messageData as ClientMessage;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

export default SocketUtils;
