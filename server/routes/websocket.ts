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
    ws.close();
    return;
  }

  // parse url to get query params
  const { query } = UrlParser.parse(request.url, true);
  const id = query.id;

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

  // prevent access for clients without id
  if (!id || typeof id !== "string") {
    ws.send(JSON.stringify({ message: "id is required" }));
    return ws.close();
  }
  // TODO: prevent access for clients with already existing id

  // filter invalid ids
  if (!ClientFilterUtils.isValidId(id)) {
    ws.send(JSON.stringify({ message: "invalid id" }));
    return ws.close();
  }

  // register client
  const newClient = wsService.createClient(id, ws);
  console.log("new connection with id: ", id);

  // handle zombie connections (clients that don't close the connection properly)
  const heartbeat = setInterval(() => {
    newClient.ws.ping();
    if (newClient.failedPings > 3) {
      newClient.ws.terminate();
      // wsService.removeClient(newClient, heartbeat, 1006);
      console.log("Terminated connection with client: ", id);
    }
    newClient.failedPings++;
  }, 3000);

  // TODO: publish realtime data to clients subscribed to the topic

  // handle different type of messages
  ws.on("message", (message) => {
    const messageData = SocketUtils.parseMessage(message, id);
    // const client = wsService.getClient(id);
    // if (!client) return;

    if (!messageData) {
      ws.send(JSON.stringify({ message: "Invalid message sintax" }));
      return;
    }

    if (messageData.event === Event.Connect) {
    }

    if (messageData.event === Event.Disconnect) {
    }

    if (messageData.event === Event.SendMessage) {
    }

    if (messageData.event === Event.Vote) {
    }

    return ws.send(JSON.stringify({ message: "Invalid message" }));
  });

  ws.on("close", (code, reason) => {
    // const client = wsService.getClient(id);
    // if (!client || !wsService.isClientConnected(client)) return;
    // wsService.removeClient(client, heartbeat, code);
  });

  ws.on("pong", () => {
    // const client = wsService.getClient(id);
    // if (!client) return;
    // client.failedPings = 0;
  });
});

wsServer.on("error", (error: Error) => {
  console.log(error);
});

export default wsServer;
