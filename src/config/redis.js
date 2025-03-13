const IORedis = require("ioredis");

const redisClient = new IORedis({
  host: process.env.REDIS_HOST, 
  port: parseInt(process.env.REDIS_PORT, 10),
//   tls: {}
  // If your ElastiCache is set for in-transit encryption, also include: tls: {}
  // If your ElastiCache uses an AUTH token: password: process.env.REDIS_PASSWORD
});

redisClient.on("error", (err) => {
  console.error("ioredis error:", err);
});

module.exports = redisClient;