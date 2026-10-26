const {Redis} = require("ioredis");

const redis = new Redis({
    host: "localhost",
    port: 6379
});

redis.on("error", (err) => console.error("Redis Client Error", err));
redis.on("connect", () => console.log("Redis connected successfully"));


module.exports = {
    redis
}