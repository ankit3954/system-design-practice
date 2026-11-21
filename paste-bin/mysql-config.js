const mysql = require("mysql2/promise");
// require("dotenv").config();

const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: 'system_design',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})


const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Successfully connected to MySQL in Docker!');
        connection.release(); 
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

module.exports = {
    pool,
    connectDB
}