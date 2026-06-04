export const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1] -- unique bucket key for this apiKey + user
local limit = tonumber(ARGV[1]) -- max requests allowed in the window
local window = tonumber(ARGV[2]) -- time window in seconds
local now = tonumber(ARGV[3]) -- current timestamp, i passed it in seconds

-- get current bucket state
local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')

local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

-- first time this key is being used
if not tokens then
  tokens = limit - 1  -- consume one token immediately

  redis.call('HSET', key,
    'tokens', tokens,
    'lastRefill', now
  )
 -- set the expiry to match that of window
 redis.call('EXPIRE', key, window)

  return {1, tokens, limit, now + window}
end

-- convert stored values from string to number
tokens = tonumber(tokens)
lastRefill = tonumber(lastRefill)

-- how fast tokens refill over time
local refillRate = limit / window

-- how much time has passed since last update
local timePassed = (now - lastRefill)

-- how many tokens should have come back in that time
local refill = refillRate * timePassed

-- add tokens back, but don't exceed the limit
tokens = math.min(limit, tokens + refill)

-- only move refill time forward if we actually added tokens
if refill > 0 then
    lastRefill = now
  end

-- no tokens left, block request
local tokensNeeded = limit - tokens
local resetAt = now + math.ceil(tokensNeeded / refillRate)
if tokens < 1 then
  redis.call('HSET', key,
    'tokens', tokens,
    'lastRefill', lastRefill
  )
  return {0, 0,  limit, resetAt}
end

-- consume one token for this request
tokens = tokens - 1

-- save updated state
redis.call('HSET', key,
  'tokens', tokens,
  'lastRefill', lastRefill
)

redis.call('EXPIRE', key, window)

return {1, tokens, limit, resetAt}
`;
