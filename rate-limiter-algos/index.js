const express = require("express");
const { redis } = require("./lib/redis");
const { rateLimiter } = require("./rate-limiter/ratelimiter-index");

const app = express();


const searchLimiter = rateLimiter({
  type: 'fixed_window',
  maxRequests: 5,
  windowSeconds: 60
});

app.get('/api/search', searchLimiter, (req, res) => {
    console.log("Search is successfull")
    res.send("Search is successfull")
});

app.listen(3000, () => {
    console.log("Server is running on port 3000")
});