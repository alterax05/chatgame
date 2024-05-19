import express from "express";
import wsServer from "./routes/websocket";
import cors from "cors";
import path from "path";
import fs from "fs";
import { default as authentication } from "./routes/authentication";
import { default as chat } from "./routes/results";
import authMiddleware from "./middleware/authMiddleware";

const app = express();

app.use(cors());
app.disable("x-powered-by"); //Reduce fingerprinting
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const pathToPublic = path.join(__dirname, "/public");

if (fs.existsSync(pathToPublic)) {
  app.use(express.static(pathToPublic));

  // using express to expose the files in the public folder
  app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"));
  });
}

app.use(authentication);
app.use(authMiddleware, chat);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack); // log error stack to console
  res.status(500).send('Something broke!');
  next();
});

// forward web socket requests to wsServer
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});