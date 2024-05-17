import { config } from "dotenv";

config();

const { URI_DB, PORT_DB, USER_DB, PASSWORD_DB, JWT_SECRET, JWT_EXPIRES_IN, HF_TOKEN } = process.env;

export { URI_DB, PORT_DB, USER_DB, PASSWORD_DB, JWT_SECRET, JWT_EXPIRES_IN, HF_TOKEN };