import { IncomingMessage } from "http";

class ClientFilterUtils {
  static getIpRequest(req: IncomingMessage): string {
    let ip: string;
    if (req.headers["x-forwarded-for"]) {
      if (typeof req.headers["x-forwarded-for"] === "string")
        ip = req.headers["x-forwarded-for"].split(",")[0];
      else ip = req.headers["x-forwarded-for"][0];
    } else {
      ip = req.socket.remoteAddress || "";
    }
    return ip;
  }
}

export default ClientFilterUtils;
