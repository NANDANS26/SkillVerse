// src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "manyamanith2006",
  database: process.env.DB_NAME || "skillverse",
  waitForConnections: true,
  connectionLimit: 10
});
