import {
  int,
  mysqlTable,
  varchar,
  boolean,
  primaryKey,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey(),
  username: varchar("username", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  password: varchar("password", { length: 256 }).notNull(),
});

export const games = mysqlTable("games", {
  id: int("id").primaryKey(),
  win: boolean("win").notNull(),
});

export const userGames = mysqlTable(
  "user_games",
  {
    userId: int("user_id").references(() => users.id),
    gameId: int("game_id").references(() => games.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.gameId] }),
    };
  }
);

export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewGame = typeof games.$inferInsert;
