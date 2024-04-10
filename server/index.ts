import express from "express";
import wsServer from "./routes/websocket";

const app = express();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

// forward web socket requests to wsServer
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});
