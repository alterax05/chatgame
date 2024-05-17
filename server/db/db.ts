import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { PASSWORD_DB, URI_DB, USER_DB} from "../utils/config.ts"

const connection = await mysql.createConnection({
    host: URI_DB,
    user: USER_DB,
    password: PASSWORD_DB,
});

const db = drizzle(connection);

export { db };