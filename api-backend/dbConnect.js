let mysql = require('mysql2');

let con = mysql.createConnection({
        host: "localhost",
        user: "FIXME",
        password: "fixme"
});

con.connect(err =>{
    if(err){
        console.error('Error connecting to MYSQL:', err);
        return;
    }
    console.log('Connected to MYSQL databas')
})