const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const waitAndMigrate = async () => {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };

  console.log('Connecting to database:', dbConfig.host, 'on port', dbConfig.port);

  let pool;
  let connected = false;
  let retries = 15;

  while (retries > 0 && !connected) {
    try {
      pool = mysql.createPool(dbConfig);
      // Test query
      await pool.query('SELECT 1');
      connected = true;
      console.log('Successfully connected to the database!');
    } catch (err) {
      console.log(`Database connection failed: ${err.message}. Retrying in 3 seconds... (${retries} retries left)`);
      retries--;
      if (pool) await pool.end();
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  if (!connected) {
    console.error('Could not connect to database after several retries. Exiting.');
    process.exit(1);
  }

  try {
    console.log('Running database migrations...');
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove database creation and use statements to run inside defaultdb
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS health;/gi, '');
    sql = sql.replace(/USE health;/gi, '');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let statement of statements) {
      if (statement.startsWith('--') || statement.startsWith('/*')) continue;
      await pool.query(statement);
    }

    console.log('Database migration complete! All tables initialized.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed during execution:', err.message);
    if (pool) await pool.end();
    process.exit(1);
  }
};

waitAndMigrate();
