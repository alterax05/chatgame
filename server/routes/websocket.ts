import { WebSocketServer } from "ws";
import UrlParser from "url";
import SocketUtils, { Event } from "../utils/socketUtils";
import WebSocketService from "../service/websocket";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import ClientFilterUtils from "../utils/clientFilterUtils";

const wsServer = new WebSocketServer({ noServer: true });
const wsService = new WebSocketService();

// limit each IP to X connections per hour
const rateLimitingOptions = {
  points: 100,
  duration: 1 * 60 * 60,
};
const rateLimiter = new RateLimiterMemory(rateLimitingOptions);

wsServer.on("connection", async (ws, request) => {
  if (!request.url) {
    ws.send(JSON.stringify({ message: "invalid url" }));
    ws.close();
    return;
  }

  const ip = ClientFilterUtils.getIpRequest(request);

  if (!ip) {
    ws.send(JSON.stringify({ message: "IP not recognized" }));
    return ws.close();
  }

  // limit connections per IP
  let rateLimitStatus: RateLimiterRes;
  try {
    rateLimitStatus = await rateLimiter.consume(ip);
  } catch (err) {
    ws.send(
      JSON.stringify({ message: "Maximum connections reached", rateInfo: err })
    );
    return ws.close();
  }

  // register client
  const client = wsService.createClient(ws);
  console.log("new connection with id: ", client.id);

  // handle zombie connections (clients that don't close the connection properly)
  const heartbeat = setInterval(() => {
    client.ws.ping();
    if (client.failedPings > 3) {
      client.ws.terminate();
      wsService.removeClient(client.id);
      console.log("Terminated connection with client: ", client.id);
      clearInterval(heartbeat);
    }
    client.failedPings++;
  }, 3000);

  // handle different type of messages
  ws.on("message", message => {
    const id = client.id;
    const messageData = SocketUtils.parseMessage(message, id);

    if (!messageData) {
      ws.send(JSON.stringify({ message: "Invalid message sintax" }));
      return;
    }

    if (messageData.event === Event.Connect) {
      const firstName = messageData.data.firstName;
      if (!firstName) return;

      return wsService.matchClient(id, firstName);
    }

    if (messageData.event === Event.Disconnect) {
      return wsService.removeClient(id);
    }

    if (messageData.event === Event.SendMessage) {
      return wsService.forwardMessage(messageData);
    }

    if (messageData.event === Event.Vote) {
      const vote = messageData.data.vote;
      if (!vote) return;

      return wsService.vote(id, vote);
    }

    return ws.send(JSON.stringify({ message: "Invalid message" }));
  });

  ws.on("close", () => {
    wsService.removeClient(client.id);
    clearInterval(heartbeat);
  });

  ws.on("pong", () => {
    client.failedPings = 0;
  });
});

wsServer.on("error", (error: Error) => {
  console.log(error);
});

export default wsServer;
