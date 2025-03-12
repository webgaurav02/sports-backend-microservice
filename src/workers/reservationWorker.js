const reservationQueue = require('../queue/reservationQueue');
const Match = require('../models/Match');
const Booking = require('../models/Booking');

reservationQueue.process(async (job, done) => {
  try {
    const { matchId, sectionId, numberOfSeats, userId } = job.data;

    // Atomically update the available seat count
    const updatedMatch = await Match.findOneAndUpdate(
      { 
        _id: matchId,
        "sections.sectionId": sectionId,
        "sections.availableSeats": { $gte: numberOfSeats }
      },
      { $inc: { "sections.$.availableSeats": -numberOfSeats } },
      { new: true }
    );

    if (!updatedMatch) {
      throw new Error('Not enough seats available or section not found');
    }

    // Create a booking record in the database
    const booking = await Booking.create({
      userId,
      matchId,
      sectionId,
      numberOfSeats,
      status: 'pending'
    });

    console.log(`Reservation successful for booking ${booking._id}`);
    done(null, { success: true, bookingId: booking._id });
  } catch (error) {
    console.error('Error processing reservation job:', error);
    done(new Error(error.message));
  }
});