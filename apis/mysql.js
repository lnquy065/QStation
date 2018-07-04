var mysql = require('mysql');
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'qstation'
});


con.connect(function(err) {
    if (err) throw err;
    console.log('Mysql connected!');
});


module.exports = con;