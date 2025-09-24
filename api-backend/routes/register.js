import fs from 'fs';

const mysql = require('mysql2/promise');
const mysqlConnection = require("../api-backend/controllers/dbConnect.js");
const {createhash} = require('crypto');
const {scryptSync, randomBytes} = require('crypto');
const crypto = require('crypto');

function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

async function register (req, res){
    try{
        const {USERNAME, EMAIL, PASSWORD, FIRST_NAME, LAST_NAME} = req.body;
        if(!EMAIL || !USERNAME){
            return res.status(400).send("Email and Username cannot be empty")
        }
        const userExistQuery = 'SELECT * FROM USER WHERE EMAIL = ? OR USERNAME = ?';

        const userAlreadyExists = await mysqlConnection.query(userExistQuery, [
            EMAIL,
            USERNAME
        ]);

        if (userAlreadyExists.length > 0){
            return  res.status(400).send("User already exist");
        }
        const salt = randomBytes(16).toString('hex');
        const hashedPassword = scryptSync(PASSWORD, salt, 64);
        const userid = generateUserId();

        const newUSerQuery= 'INSERT INTO user ()'

    }catch(error){
        return   res.status(500).send({ error: error.message });
    }
     
}