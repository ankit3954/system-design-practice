const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    password: "Gadhahadi123#",
    user: "root",
    database: "movie_reservation",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;