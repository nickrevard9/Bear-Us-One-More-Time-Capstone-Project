// createTestUser.js

const mysql = require('mysql2/promise');
const { scryptSync, randomBytes } = require('crypto');

async function main() {
  // ✅ 1. Connect to your MySQL container or database
  const db = await mysql.createConnection({
    host: 'localhost',       // or '127.0.0.1'
    user: 'root',            // your MySQL username
    password: 'password',    // your MySQL password
    database: 'media_tracker_db' // change if your DB name differs
  });

  // ✅ 2. Define user info
  const USERNAME = 'testuser';
  const EMAIL = 'testuser@example.com';
  const PASSWORD = 'password123';
  const FIRST_NAME = 'Test';
  const LAST_NAME = 'User';
  const ROLE_ID = 1; // if 1 = normal user in your schema

  // ✅ 3. Hash the password with a random salt
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = scryptSync(PASSWORD, salt, 64).toString('hex');

  // ✅ 4. Insert user into the database
  try {
    await db.query(
      `INSERT INTO user (username, email, user_password, salt, first_name, last_name, user_role_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [USERNAME, EMAIL, hashedPassword, salt, FIRST_NAME, LAST_NAME, ROLE_ID]
    );

    console.log('✅ User created successfully!');
    console.log(`Username: ${USERNAME}`);
    console.log(`Password: ${PASSWORD}`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('⚠️ User already exists.');
    } else {
      console.error('❌ Error creating user:', err);
    }
  } finally {
    await db.end();
  }
}

main();
