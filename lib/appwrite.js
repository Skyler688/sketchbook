import { Client, TablesDB, Query, ID } from "node-appwrite";

const client = new Client()
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setKey(process.env.APPWRITE_API_KEY);

const database = new TablesDB(client);

const database_id = process.env.APPWRITE_DATABASE_ID;

export { client, database, database_id, Query, ID };
