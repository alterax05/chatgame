import express from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { db } from "../db/db";
import { NewUser, users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import clientUtils from "../utils/clientUtils";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../utils/config";
import { Request, Response } from "express";

const router = express.Router();

// Login route
router.post("/login", async (req: Request, res: Response) => {
  const loginInfo = clientUtils.getLoginInfo(req);

  if (!loginInfo) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { username, password } = loginInfo;

  const result = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const { password: hashedPassword } = result[0];

  if (hashedPassword && bcrypt.compareSync(password, hashedPassword)) {
    const token = jwt.sign({ username }, JWT_SECRET ?? "super-secret", {
      expiresIn: JWT_EXPIRES_IN ?? "1h",
    });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

//register route
router.post("/register", async (req: Request, res: Response) => {
  const newUser = clientUtils.getLoginInfo(req);

  if (!newUser) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { username, password } = newUser;

  const result = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (result.length > 0) {
    res.status(400).json({ error: "Username already exists" });
    return;
  }

  await db
    .insert(users)
    .values({ ...newUser, password: bcrypt.hashSync(password, 10) });

  const token = jwt.sign({ username }, JWT_SECRET ?? "super-secret", {
    expiresIn: JWT_EXPIRES_IN ?? "1h",
  });

  res.json({ token });
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const oldToken = req.headers["authorization"] as string;
    const decoded = jwt.verify(
      oldToken,
      JWT_SECRET ?? "super-secret",
      { maxAge: JWT_EXPIRES_IN ?? "1h" }
    ) as JwtPayload;
    const token = jwt.sign(
      { username: decoded.username },
      JWT_SECRET ?? "super-secret",
      { expiresIn: JWT_EXPIRES_IN ?? "1h" }
    );
    console.log("refreshed token");
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
