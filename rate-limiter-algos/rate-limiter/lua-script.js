const FIXED_WINDOW = `
    local key = KEYS[1]
    local maxRequest = tonumber(ARGV[1])
    local timeWindow = tonumber(ARGV[2])

    local count = redis.call('INCR', key)

    if count == 1 then
        redis.call('EXPIRE', key, timeWindow)
    end

    local pttl = redis.call('PTTL', key);

    return {
        count,
        pttl
    }
`

module.exports = {
    FIXED_WINDOW
}


