-- src/scripts/popSeats.lua
local availableKey = KEYS[1]

local requested = tonumber(ARGV[1])
local seats = redis.call('ZRANGE', availableKey, 0, requested - 1)
if #seats < requested then
    return {}
end
for i, seat in ipairs(seats) do
    redis.call('ZREM', availableKey, seat)
end
return seats