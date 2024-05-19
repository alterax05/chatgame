import { IncomingMessage } from "http";
import { Request } from "express";
import { z } from "zod";
import { LoginInfo } from "../types/types";

class ClientUtils {
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

  static getLoginInfo(req: Request) {
    try {
      const loginInfo = loginScheme.parse(req.body);
      return loginInfo as LoginInfo;
    } catch (e) {
      return null;
    }
  }
}

export default ClientUtils;

export const loginScheme = z.object({
  username: z.string(),
  password: z.string(),
});
