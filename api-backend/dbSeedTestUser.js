// dbSeedTestUser.js (connection snippet)
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',   // not 'localhost'
    port: 3306,          // whatever you published (e.g., "3306:3306")
    user: 'app',
    password: 'app123',
    database: 'media_tracker_db'
  });

  // seed role + user (idempotent)
  await conn.execute(
    `INSERT INTO user_role (user_role_id, role)
     VALUES (1,'student'), (2,'admin')
     ON DUPLICATE KEY UPDATE role = VALUES(role);`
  );

  await conn.execute(
    `INSERT INTO \`user\`
      (user_id, email, username, user_password, user_role_id, first_name, last_name, create_date)
     VALUES (1,'test@example.com','testuser','Password!234',1,'Test','User',CURDATE())
     ON DUPLICATE KEY UPDATE
       email=VALUES(email), username=VALUES(username), user_password=VALUES(user_password),
       user_role_id=VALUES(user_role_id), first_name=VALUES(first_name), last_name=VALUES(last_name),
       create_date=VALUES(create_date);`
  );

  console.log('Seeded test user 👍');
  await conn.end();
}

main().catch(console.error);
