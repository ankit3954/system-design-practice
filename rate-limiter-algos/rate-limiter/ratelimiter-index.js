const { runFixedWindow } = require("./algo-execution");

const rateLimiter = (config) => {
    return async (req, res, next) => {
        try {
            const ip = "123456"
            const user_ip = `rate_limit:${config.type}:${ip}`;
            console.log(user_ip)
            let result;

            switch (config.type) {
                case 'fixed_window':
                    result = await runFixedWindow(user_ip, config);
                    break;
                default:
                    throw new Error("Unknown rate limiting algorithm")
            }

            res.setHeader('X-RateLimit-Limit', config.maxRequests);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            console.log(result)
            if (!result.allowed) {
                res.setHeader('Retry-After', result.retryAfter || 1);
                return res.status(429).json({ error: 'Too Many Requests' });
            }else{
                next()
            }
        } catch (error) {
            console.error('Rate Limiter Error:', error);
            next();
        }

    }
}

module.exports = {
    rateLimiter
}