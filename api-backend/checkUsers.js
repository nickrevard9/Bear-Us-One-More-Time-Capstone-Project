const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',   // not "localhost"
    port: 3306,
    user: 'app',         // or whatever user you created
    password: 'app123',
    database: 'media_tracker_db'
  });

  const [rows] = await conn.query('SELECT user_id, email, username, first_name, last_name FROM `user`;');
  console.table(rows);

  await conn.end();
}

main().catch(console.error);
