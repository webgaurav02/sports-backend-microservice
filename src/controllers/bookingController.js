// src/controllers/bookingController.js
const Booking = require('../models/Booking');
const MatchAvailability = require('../models/MatchAvailability');
// const redisClient = require('../config/redis'); // Removed Redis
// const { default: Redlock } = require('redlock');   // Removed Redlock
const { publishSeatUpdate } = require('../socket');

/**
 * POST /api/bookings/check-and-lock
 * Request body: { sectionId, matchId, requestedSeats, transactionId, userId }
 *
 * This endpoint checks if there are enough available seats in the MatchAvailability document,
 * atomically updates the locked seats and available quantity, creates a pending booking in MongoDB,
 * and publishes real-time seat updates via WebSockets.
 */
exports.checkAndLockSeats = async (req, res) => {
  const { sectionId, matchId, requestedSeats, transactionId, userId } = req.body;

  try {
    // Atomically check and update the MatchAvailability document:
    // It will only update if availableQuantity is at least the requestedSeats.
    const updatedAvailability = await MatchAvailability.findOneAndUpdate(
      {
        matchID: matchId,
        section: sectionId,
        availableQuantity: { $gte: requestedSeats }
      },
      {
        $inc: {
          lockedSeats: requestedSeats,
          availableQuantity: -requestedSeats
        }
      },
      { new: true } // Return the updated document
    );

    if (!updatedAvailability) {
      return res.status(400).json({ success: false, error: 'Not enough seats available' });
    }

    // Create a booking record with a lock expiration (e.g., 10 minutes)
    const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const booking = await Booking.create({
      userId,
      matchId,
      sectionId,
      numberOfSeats: requestedSeats,
      transactionId,
      status: 'pending',
      lockExpiresAt,
    });

    // Publish real-time seat availability update (clients should be listening for these updates)
    publishSeatUpdate(matchId, sectionId);

    return res.json({ success: true, numberOfSeats: booking.numberOfSeats });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};