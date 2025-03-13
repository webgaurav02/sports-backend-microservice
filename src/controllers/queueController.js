// controllers/queueController.js
const redis = require("redis");

// Create a Redis client (adjust options as needed)
const client = redis.createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
});
client.connect();

// For demonstration, we assume the initial allowed batch is 5000 users.
// In a real-world scenario, you might update the threshold every 10 minutes.
const INITIAL_THRESHOLD = 2000;

// Endpoint to "enter" the queue
exports.enterQueue = async (req, res) => {

    try {
        // Each click increments a global counter and returns the user's rank.
        const rank = await client.incr("bookingQueueCounter");

        // Determine if the user is allowed immediately (if rank <= allowed threshold)
        const allowed = rank <= INITIAL_THRESHOLD;

        // You can also store the user's rank (or a token) in Redis or set a cookie for later validation.
        res.json({ success: true, allowed, rank });
    } catch (err) {
        console.error("Error entering queue:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Endpoint to check the user's queue status
exports.queueStatus = async (req, res) => {
    try {
        // The client sends their assigned rank (from the cookie or query param)
        const { rank } = req.query;
        if (!rank) {
            return res.status(400).json({ success: false, error: "Rank is required" });
        }

        // In a real system, the allowed threshold might increase over time.
        // For simplicity, we assume the threshold remains INITIAL_THRESHOLD for now.
        // You could calculate the current threshold based on the current time.
        const currentThreshold = INITIAL_THRESHOLD;
        const allowed = Number(rank) <= currentThreshold;

        res.json({ success: true, allowed, currentThreshold });
    } catch (err) {
        console.error("Error fetching queue status:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};