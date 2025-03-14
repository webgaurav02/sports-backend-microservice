// src/workers/reservationWorker.js
const Booking = require('../models/Booking');
const MatchAvailability = require('../models/MatchAvailability');
const { publishSeatUpdate } = require('../socket');

async function unlockExpiredBookings() {
  const now = new Date();
  const expiredBookings = await Booking.find({
    lockExpiresAt: { $lt: now },
    status: 'pending'
  });

  for (const booking of expiredBookings) {
    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Update the MatchAvailability record in the database:
    // Increase availableQuantity by the number of expired seats
    // Decrease lockedSeats accordingly
    await MatchAvailability.findOneAndUpdate(
      { matchID: booking.matchId, section: booking.sectionId },
      {
        $inc: {
          availableQuantity: booking.numberOfSeats,
          lockedSeats: -booking.numberOfSeats,
        },
      }
    );

    // Publish the updated seat availability so that connected clients can update their UI.
    publishSeatUpdate(booking.matchId, booking.sectionId);
  }
}

// Schedule the unlock job to run every minute.
setInterval(unlockExpiredBookings, 60 * 1000);
console.log('Reservation worker started: checking expired bookings every minute.');