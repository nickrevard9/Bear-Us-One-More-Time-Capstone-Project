const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "media_tracker_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

async function debug() {

  const [rows] = await pool.query("SHOW DATABASES");
  console.log(rows);
  
  // Switch to the target database
  await pool.query(`USE media_tracker_db`);

  // Show tables
  const [tables] = await pool.query('SHOW TABLES');

  console.log(`Tables in media_tracker_db:`);
  for (const row of tables) {
    const tableName = Object.values(row)[0]; // Extract table name from row
    console.log(`- ${tableName}`);

    const [columns] = await pool.query(`DESCRIBE \`${tableName}\``);

    for (const col of columns) {
      console.log(`   • ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key || ''}`);
    }
  }
}

debug()
 
module.exports = pool