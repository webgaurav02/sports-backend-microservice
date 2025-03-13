// src/workers/reservationWorker.js
const Booking = require('../models/Booking');
const redisClient = require('../config/redis');
const { publishSeatUpdate } = require('../socket');

async function unlockExpiredBookings() {
  const now = new Date();
  const expiredBookings = await Booking.find({
    lockExpiresAt: { $lt: now },
    status: 'pending'
  });

  for (const booking of expiredBookings) {
    booking.status = 'cancelled';
    await booking.save();

    const availableKey = `available:match:${booking.matchId}:section:${booking.sectionId}`;
    const pipeline = redisClient.multi();
    for (const seat of booking.seatNumbers) {
      // Re-add the seat back to the sorted set (using the seat number as both score and member)
      pipeline.zAdd(availableKey, { score: seat, value: seat.toString() });
    }
    await pipeline.exec();

    // Publish the updated seat availability so that connected clients can update their UI.
    publishSeatUpdate(booking.matchId, booking.sectionId);
  }
}

// Schedule the unlock job to run every minute.
setInterval(unlockExpiredBookings, 60 * 1000);
console.log('Reservation worker started: checking expired bookings every minute.');











// const reservationQueue = require('../queue/reservationQueue');
// const Match = require('../models/Match');
// const Booking = require('../models/Booking');

// reservationQueue.process(async (job, done) => {
//   try {
//     const { matchId, sectionId, numberOfSeats, userId } = job.data;

//     // Atomically update the available seat count
//     const updatedMatch = await Match.findOneAndUpdate(
//       { 
//         _id: matchId,
//         "sections.sectionId": sectionId,
//         "sections.availableSeats": { $gte: numberOfSeats }
//       },
//       { $inc: { "sections.$.availableSeats": -numberOfSeats } },
//       { new: true }
//     );

//     if (!updatedMatch) {
//       throw new Error('Not enough seats available or section not found');
//     }

//     // Create a booking record in the database
//     const booking = await Booking.create({
//       userId,
//       matchId,
//       sectionId,
//       numberOfSeats,
//       status: 'pending'
//     });

//     console.log(`Reservation successful for booking ${booking._id}`);
//     done(null, { success: true, bookingId: booking._id });
//   } catch (error) {
//     console.error('Error processing reservation job:', error);
//     done(new Error(error.message));
//   }
// });
