const mysql = require('mysql2/promise');
const db = require("../controllers/dbConnect.js");
const {createhash} = require('crypto');
const {scryptSync, randomBytes} = require('crypto');
const crypto = require('crypto');

function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

async function register ({USERNAME, EMAIL, PASSWORD, FIRST_NAME, LAST_NAME}){
    try{
        if(!EMAIL || !USERNAME){
            throw new Error("Email and Username cannot be empty");
        }
        const userExistQuery = 'SELECT * FROM user WHERE EMAIL = ? OR USERNAME = ?';

        const [userAlreadyExists] = await db.query(userExistQuery, [
            EMAIL,
            USERNAME
        ]);

        if (userAlreadyExists.length > 0){
            throw new Error("User already exists");
        }
        const salt = randomBytes(16).toString('hex');
        const hashedPassword = scryptSync(PASSWORD, salt, 64);
        const userid = generateUserId();

        await db.query(
            `INSERT INTO user (username, email, user_password, salt, first_name, last_name, user_role_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [USERNAME, EMAIL, hashedPassword.toString('hex'), salt, FIRST_NAME, LAST_NAME, 1]
        );

        return "User created!"

    }catch(error){
        console.error("Register error:", error);
    }
}

module.exports = register;