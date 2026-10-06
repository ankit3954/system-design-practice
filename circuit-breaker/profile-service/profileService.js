const pool = require("../dbConfig");

const getProfileById = async(id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users where id = ?', [id]);
        return rows;
    } catch (error) {
        console.log(error)
    }
}



module.exports = getProfileById;