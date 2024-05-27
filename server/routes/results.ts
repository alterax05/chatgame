import express from "express";
import { db } from "../db/db";
import { count, eq } from "drizzle-orm";
import { games, userGames, users } from "../db/schema";

const router = express.Router();

router.get("/results", async (req, res) => {
  const username = req.body.username as string;

  if (!username) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const results = await db
    .select({win: count(eq(games.status, "win")), lost: count(eq(games.status, "lost"))})
    .from(games)
    .innerJoin(userGames, eq(userGames.gameId, games.id))
    .innerJoin(users, eq(users.id, userGames.userId))
    .where(eq(users.username, username));

  res.json({...results[0], username});

});

export default router;