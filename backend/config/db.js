const mysql = require('mysql2/promise');
require('dotenv').config();

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    uri: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
