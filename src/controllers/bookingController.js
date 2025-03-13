// src/controllers/bookingController.js
const fs = require('fs');
const path = require('path');
const Booking = require('../models/Booking');
const redisClient = require('../config/redis'); // Single ioredis instance
const { default: Redlock } = require('redlock');
const Client = require("ioredis");

const { publishSeatUpdate } = require('../socket');

// Create a Redlock instance using the SAME redis client
const redlock = new Redlock([redisClient], {
  retryCount: 3,
  retryDelay: 200,
});


// Read the Lua script for atomically popping seats from a sorted set
const popSeatsLuaScript = fs.readFileSync(
  path.join(__dirname, '../scripts/popSeats.lua'),
  'utf8'
);

/**
 * POST /api/bookings/check-and-lock
 * Request body: { sectionId, matchId, requestedSeats, transactionId, userId }
 *
 * This endpoint acquires a distributed lock via Redlock, pops seats from Redis, creates
 * a pending booking in MongoDB, and publishes real-time seat updates via WebSockets.
 */
exports.checkAndLockSeats = async (req, res) => {

  const { sectionId, matchId, requestedSeats, transactionId, userId } = req.body;

  // console.log(sectionId, matchId, requestedSeats, transactionId, userId)

  const availableKey = `available:match:${matchId}:section:${sectionId}`;
  const lockKey = `lock:match:${matchId}:section:${sectionId}`;

  let lock;

  try {
    // Acquire a distributed lock for 10 seconds
    lock = await redlock.acquire([lockKey], 10000);
  } catch (err) {
    return res
      .status(503)
      .json({ success: false, error: 'Could not acquire lock, please retry' });
  }

  try {
    // Use Redis EVAL to atomically pop the requested seats using our Lua script

    const seats = await redisClient.eval(
      popSeatsLuaScript,
      1,                      // number of keys
      availableKey,           // key1
      requestedSeats.toString() // first argument to the Lua script
    );


    console.log("[REDIS] Locked seats:", seats);

    if (!seats || seats.length < requestedSeats) {
      await lock.release();
      return res
        .status(400)
        .json({ success: false, error: 'Not enough seats available' });
    }

    // Create a booking record with a lock expiration (e.g., 10 minutes)
    const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const booking = await Booking.create({
      userId,
      matchId,
      sectionId,
      numberOfSeats: requestedSeats,
      seatNumbers: seats.map(Number),
      transactionId,
      status: 'pending',
      lockExpiresAt,
    });

    // Optionally store a separate Redis key for this booking to auto-expire if desired
    await redisClient.set(
      `booking:${booking._id}`,
      JSON.stringify({ seatNumbers: seats }),
      { EX: 10 * 60 } // 10 minutes
    );

    // Publish real-time seat availability update (e.g., via Socket.io)
    publishSeatUpdate(matchId, sectionId);

    // Release the Redlock
    await lock.release();

    return res.json({ success: true, assignedSeats: booking.seatNumbers });
  } catch (error) {
    await lock.release();
    return res.status(400).json({ success: false, error: error.message });
  }
};