const express = require("express");
const pool = require("../dbConfig");
const getProfileById = require("./profileService");


const app = express();

app.use(express.json());

app.listen(3000, () => {
    console.log("Profile Server is running on 3000")
})


app.get('/profiles', async (req, res) => {
  try {
    // Execute the database query
    const [rows] = await pool.query('SELECT * FROM users');
    
    // Send the data back as JSON
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});


app.get('/profiles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await getProfileById(id);
    // Send the data back as JSON
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});
