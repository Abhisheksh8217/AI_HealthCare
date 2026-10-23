const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const waitAndMigrate = async () => {
  console.log('[Database] Checking connection to database...');

  let connected = false;
  let retries = 15;

  while (retries > 0 && !connected) {
    try {
      await db.query('SELECT 1');
      connected = true;
      console.log('[Database] Successfully connected!');
    } catch (err) {
      console.log(`[Database] Connection waiting: ${err.message}. Retrying in 3 seconds... (${retries} retries left)`);
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  if (!connected) {
    console.error('[Database] Could not connect to database after several retries. Exiting.');
    process.exit(1);
  }

  try {
    console.log('[Migration] Running database migrations...');
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove database creation and use statements so tables are created in the active connected database
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS [`\w]+;/gi, '');
    sql = sql.replace(/USE [`\w]+;/gi, '');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let statement of statements) {
      if (statement.startsWith('--') || statement.startsWith('/*')) continue;
      await db.query(statement);
    }

    console.log('[Migration] Database migration complete! All tables verified and ready.');
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Migration failed during execution:', err.message);
    process.exit(1);
  }
};

waitAndMigrate();
