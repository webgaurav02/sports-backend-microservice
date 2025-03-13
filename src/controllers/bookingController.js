// controllers/bookingController.js

const Queue = require('bull');

// Create a queue instance with your Redis configuration
// Here, 'bookingQueue' is the queue name.
const bookingQueue = new Queue('bookingQueue', {
  redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

// Process up to 5000 booking jobs concurrently
bookingQueue.process(5000, async (job) => {
  
  const bookingData = job.data;
  console.log(`Processing booking for user ${bookingData.userId} for section ${bookingData.sectionId}`);
  
  // TODO: Implement your booking logic here:
  // - Check if seats are still available.
  // - Lock/mark seats as booked.
  // - Deduct inventory.
  // - Save the booking record in your DB.
  // This example simply returns a successful message.
  
  // Simulate processing delay (remove in production)
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  return { success: true, bookingId: `booking_${job.id}` };
});

// API controller function to add a booking job
exports.enqueueBooking = async (req, res) => {
  
  try {
    const bookingData = req.body; // e.g., { userId, sectionId, matchId, requestedSeats }
    // Enqueue the booking job into the queue
    const job = await bookingQueue.add(bookingData);
    res.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error("Error enqueuing booking:", error);
    res.status(500).json({ success: false, error: error.message });
  }
  
};