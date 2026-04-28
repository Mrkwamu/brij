export const TOKEN_BUCKET_SCRIPT = `
  local key = KEYS[1] -- unique key in redis for this apikey and this specific person making the request
  local limit = tonumber(ARGV[1]) -- pass the total limit from the db
  local window = tonumber(ARGV[2]) -- pass the window frame from db
  local now = tonumber(ARGV[3]) -- the current time in milliseconds
  local lockKey = key .. ':lock' -- unique lock key for this bucket

  -- try to claim a lock on this key so no other request can run this script at the same time
  -- NX means only set if it doesn't exist, PX means expire in milliseconds
  local locked = redis.call('SET', lockKey, 1, 'NX', 'PX', 100)

  -- if we couldn't claim the lock another request is already running so reject immediately
  if not locked then
    return {0, 0, 1}
  end

  local bucket = redis.call('GET', key) -- get the bucket from redis

  local tokens
  local lastRefill

  if not bucket then
    -- first time this person is using this apikey
    -- try to claim the bucket creation with SETNX so only one request creates it
    local created = redis.call('SET', key, cjson.encode({tokens = limit - 1, lastRefill = now}), 'NX', 'EX', window)

    -- release the lock
    redis.call('DEL', lockKey)

    if not created then
      -- another request already created the bucket between our GET and SET
      -- tell the client to retry
      return {0, 0, 1}
    end

    -- give them a full bucket minus the one they just used
    return {1, limit - 1, 0}
  end

  -- bucket exists so this person has been here before
  local data = cjson.decode(bucket)
  tokens = data.tokens
  lastRefill = data.lastRefill

  -- get how many secs passed after we last updated their bucket
  -- divide by 1000 so we work in seconds not milliseconds
  local timePassed = (now - lastRefill) / 1000

  -- how many tokens come back per second based on their policy
  local tokenPerSecond = limit / window

  -- how many tokens came back in the time that passed, floor so we won't have a half token
  local tokensToAdd = math.floor(timePassed * tokenPerSecond)

  -- add the refilled tokens back but never go above the max, always pick the lowest
  tokens = math.min(limit, tokens + tokensToAdd)

  -- update lastRefill only if tokens actually came back
  if tokensToAdd > 0 then
    lastRefill = now
  end

  -- no tokens left so block the request
  if tokens < 1 then
    redis.call('SET', key, cjson.encode({tokens = tokens, lastRefill = lastRefill}), 'KEEPTTL')

    -- release the lock before returning
    redis.call('DEL', lockKey)

    return {0, 0, 0}
  end

  -- they have tokens so use one and allow the request
  tokens = tokens - 1

  redis.call('SET', key, cjson.encode({tokens = tokens, lastRefill = lastRefill}), 'KEEPTTL')

  -- release the lock before returning
  redis.call('DEL', lockKey)

  return {1, tokens, 0}
`;
