import express from "express";
import { db } from "../db/db";
import { and, count, eq } from "drizzle-orm";
import { games, userGames, users } from "../db/schema";

const router = express.Router();

router.get("/results", async (req, res) => {
  const username = req.body.username as string;

  if (!username) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const totalUserWins = await db
    .select({ win: count(games.status) })
    .from(games)
    .innerJoin(userGames, eq(userGames.gameId, games.id))
    .innerJoin(users, eq(users.id, userGames.userId))
    .where(and(eq(users.username, username), eq(games.status, "win")));

  const totalUserLosses = await db
    .select({ lost: count(games.status) })
    .from(games)
    .innerJoin(userGames, eq(userGames.gameId, games.id))
    .innerJoin(users, eq(users.id, userGames.userId))
    .where(and(eq(users.username, username), eq(games.status, "lost")));

  res.json({ win: totalUserWins[0].win, lost: totalUserLosses[0].lost, username });
});

export default router;
