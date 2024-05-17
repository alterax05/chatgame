import { defineConfig } from "drizzle-kit";
import { PASSWORD_DB, URI_DB, USER_DB} from "./utils/config"

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: "localhost",
    user: "root",
    //password: PASSWORD_DB!,
    port: 3306,
    database: "chatgame",
  },
});