const express = require("express");
const pool = require("./dbConfig");
const getProfileById = require("./profile-service/profileService");


const app = express();

app.use(express.json());

app.listen(3001, () => {
    console.log("Booking Server is running on 3001")
})


const getBookingsById = async(id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bookings where user_id = ?', [id]);
        return rows;
    } catch (error) {
        console.log(error)
    }
    
}

app.get('/bookings/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const bookings = await getBookingsById(id);
    const profileServiceStatus = await pool.query("Select sevice_status from circuit_breaker where service_name = ?", ["profile"]);
    let userDetails = {
        name: "Ankit"
    }
    console.log()
    if(profileServiceStatus[0][0].sevice_status === "ON"){
         userDetails = await getProfileById(id);
    }
    
    // Send the data back as JSON
    res.json({ success: true, data: {bookings, userDetails} });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

