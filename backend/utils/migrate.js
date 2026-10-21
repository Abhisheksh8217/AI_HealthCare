const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Starting migration to Aiven cloud database...');
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove DATABASE statements so tables are created in the active defaultdb database
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS health;/gi, '');
    sql = sql.replace(/USE health;/gi, '');

    // Split statements by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let statement of statements) {
      if (statement.startsWith('--') || statement.startsWith('/*')) continue;
      await db.query(statement);
    }

    console.log('Database migration complete! All tables initialized in defaultdb.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
