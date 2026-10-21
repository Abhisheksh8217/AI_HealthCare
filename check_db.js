const mysql = require('./backend/node_modules/mysql2/promise');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

const check = async () => {
  let conn;
  try {
    console.log('Connecting to local MySQL database...');
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'defaultdb'
    });

    console.log('Successfully connected!');
    const [tables] = await conn.query('SHOW TABLES');
    
    console.log('\n--- Database Tables & Row Counts ---');
    if (tables.length === 0) {
      console.log('No tables found. Run node utils/migrate.js inside backend directory first!');
    }
    
    for (let t of tables) {
      const tableName = Object.values(t)[0];
      const [[countResult]] = await conn.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`• ${tableName.padEnd(20)} : ${countResult.count} records`);
    }
    console.log('-------------------------------------\n');
    
  } catch (err) {
    console.error('Failed to query database:', err.message);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
};

check();
