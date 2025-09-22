
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const schemaSqlPathname = path.join(__dirname, 'schema.sql');
const schemaStyle = fs.readFileSync(schemaSqlPathname, 'utf8');


async function applySchema() {
  const connection = await mysql.createConnection({         
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    multipleStatements: true 
       });
       

  await connection.query(schemaStyle); // executes the SQL schema

  console.log('Schema applied!');
  await connection.end();
}


applySchema().catch(console.error);