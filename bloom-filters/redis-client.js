const redis = require("redis");

const redisClient = redis.createClient();

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

const connectRedisClient = async() => {
    try {
    await redisClient.connect();
    console.log('Redis connected successfully!');

  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
}




module.exports = {
    redisClient,
    connectRedisClient
}