import { WebSocket } from "ws";
import { Client, ClientMessage } from "../types/socket";

class WebSocketService {
  public forwardMessage(message: ClientMessage) {}

  public createClient(id: string, ws: WebSocket) {
    const newClient: Client = {
      id,
      ws,
      subscriptions: [],
      failedPings: 0,
    };

    // TODO: ADD TO CLIENTS LIST OR ROOMS

    return newClient;
  }
}

export default WebSocketService;
