import { WebSocketServer } from "ws";
import SocketUtils, { Event } from "../utils/socketUtils";
import GameService from "../service/gameService";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import ClientUtils from "../utils/clientUtils";

const wsServer = new WebSocketServer({ noServer: true });
const chatService = new GameService();

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

  const ip = ClientUtils.getIpRequest(request);

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
  const client = chatService.registerClient(ws);
  console.log("new connection with id: ", client.id);

  // handle zombie connections (clients that don't close the connection properly)
  const heartbeat = setInterval(() => {
    client.ws.ping();
    if (client.failedPings > 3) {
      client.ws.terminate();
      chatService.disconnectClient(client);
      console.log("Terminated connection with client: ", client.id);
      clearInterval(heartbeat);
    }
    client.failedPings++;
  }, 3000);

  // handle different type of messages
  ws.on("message", message => {
    const id = client.id;

    const user = chatService.getUserById(id);
    const room = user?.chatData?.roomId
      ? chatService.findRoomById(user?.chatData?.roomId)
      : undefined;

    const messageData = SocketUtils.parseMessage(message, id);

    if (!messageData) {
      ws.send(JSON.stringify({ message: "Invalid message sintax" }));
      return;
    }

    if (messageData.event === Event.Connect) {
      const firstName = messageData.data.firstName;
      if (!firstName) return;

      return chatService.addPlayerInMatchMaking(id, firstName);
    }

    // allow the following actions only for users inside a chat room
    if (!user || !room)
      return ws.send(
        JSON.stringify({
          message: "Invalid event. You must be inside a chat room",
        })
      );

    if (messageData.event === Event.Disconnect) {
      console.log("player disconnected with id: ", client.id);
      return chatService.disconnectClient(user);
    }

    if (messageData.event === Event.SendMessage) {
      return chatService.forwardMessageToRoomPlayers(user, room, messageData);
    }

    if (messageData.event === Event.Vote) {
      const vote = messageData.data.vote;
      if (!vote) return;

      return chatService.votePlayerToEliminate(user.id, room, vote);
    }

    return ws.send(JSON.stringify({ message: "Invalid event" }));
  });

  ws.on("close", () => {
    chatService.disconnectClient(client);
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
