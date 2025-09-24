const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    multipleStatements: true
  });

  const [rows] = await connection.query("SHOW DATABASES");
  console.log(rows);
  
  // Switch to the target database
  await connection.query(`USE media_tracker_db`);

  // Show tables
  const [tables] = await connection.query('SHOW TABLES');

  console.log(`Tables in media_tracker_db:`);
  for (const row of tables) {
    const tableName = Object.values(row)[0]; // Extract table name from row
    console.log(`- ${tableName}`);
  }

  return connection;
  await connection.end();
}

main().catch(console.error);

