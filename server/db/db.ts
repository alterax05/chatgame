import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { PASSWORD_DB, URI_DB, USER_DB} from "../utils/config"

const connection = mysql.createConnection({
    host: URI_DB,
    user: USER_DB,
    password: PASSWORD_DB,
    database: "chatgame",
});

export const db = drizzle(connection);