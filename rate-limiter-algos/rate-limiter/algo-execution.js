const { redis } = require("../lib/redis");
const { FIXED_WINDOW } = require("./lua-script");

const runFixedWindow = async (key, config) => {
    // console.log(config.maxRequests.toString(), config.windowSeconds.toString())
    const result = (await redis.eval(FIXED_WINDOW, 
        1, 
        key,
        config.maxRequests.toString(),
        config.windowSeconds.toString()
    ));

    const count = result[0];
    const pttl = result[1];
    let allowed = false;

    if(count <= config.maxRequests){
        allowed = true;
    }

    return {
        allowed,
        pttl,
        remaining: Math.max(0, config.maxRequests - count),
        retryAfter: !allowed ? (pttl > 0 ? pttl / 1000 : config.windowSeconds) : null,
    }
}


module.exports = {
    runFixedWindow
}