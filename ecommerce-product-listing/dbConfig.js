const mysql = require("mysql2/promise");

const masterPool = mysql.createPool({
    user: "root",
    host: "localhost",
    port: 3306,
    password: "Gadhahadi123#",
    database: "system_design_concepts",
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
});

const replicaPool = mysql.createPool({
    user: "root",
    host: "localhost",
    port: 3307,
    password: "Gadhahadi123#",
    database: "system_design_concepts",
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
});

module.exports = {
   write: async (sql, params) => {
    try {
      const [rows] = await masterPool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('Master DB Error:', err.message);
      throw err;
    }
  },

  read: async (sql, params) => {
    try {
      const [rows] = await replicaPool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('Replica DB Error (Falling back to Master):', err.message);
      // If replica drops route read to Master
      const [rows] = await masterPool.execute(sql, params);
      return rows;
    }
  }
};