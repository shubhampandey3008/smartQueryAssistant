import { createPool } from "mysql2/promise";

console.log(process.env.DB_HOST);

export const connection = async () => {
  const pool = await createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306 || process.env.DB_PORT,
    connectionLimit: 10 || process.env.DB_CONNECTION_LIMIT,
    // ssl: {
    //   ca : process.env.SSL_CA
    // }
  });

  return pool;
};
