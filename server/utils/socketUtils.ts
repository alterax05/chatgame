import { RawData } from "ws";
import { ClientMessage } from "../types/socket";
import z from "zod";

export enum Event {
  Connect = "connect",
  Disconnect = "disconnect",
  SendMessage = "sendMessage",
  Vote = "vote",
}

export const messageScheme = z.object({
  from: z.string(),
  event: z.string(),
  data: z.union([
    z.object({ message: z.string() }),
    z.object({ vote: z.string() }),
  ]),
});

class SocketUtils {
  static parseMessage(message: RawData, id: string) {
    try {
      const json = JSON.parse(message.toString());
      const messageData = messageScheme.parse(json);
      messageData.from = id;
      return messageData as ClientMessage;
    } catch (e) {
      return null;
    }
  }
}

export default SocketUtils;
