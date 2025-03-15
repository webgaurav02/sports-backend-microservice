// controllers/queueController.js
const redisClient = require('../config/redis');

// For demonstration, we assume the initial allowed batch is 5000 users.
// In a real-world scenario, you might update the threshold every 10 minutes.
// controllers/queueController.js
const INITIAL_THRESHOLD = 500; // Updated to 500

exports.enterQueue = async (req, res) => {
    try {
        const { matchId } = req.body;
        if (!matchId) return res.status(400).json({ error: "Match ID required" });

        const counterKey = `bookingQueueCounter:${matchId}`;
        const rank = await redisClient.incr(counterKey);

        // Set queue start time if first user
        if (rank === 1) {
            await redisClient.set(`queueStartTime:${matchId}`, Date.now());
        }

        const startTime = await redisClient.get(`queueStartTime:${matchId}`);
        const currentThreshold = calculateCurrentThreshold(startTime);

        const allowed = rank <= currentThreshold;
        res.json({ success: true, allowed, rank });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.queueStatus = async (req, res) => {
    try {
        const { rank, matchId } = req.query;
        if (!rank || !matchId) return res.status(400).json({ error: "Rank and Match ID required" });

        const startTime = await redisClient.get(`queueStartTime:${matchId}`);
        const currentThreshold = calculateCurrentThreshold(startTime);

        const allowed = Number(rank) <= currentThreshold;
        res.json({ success: true, allowed, currentThreshold });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

function calculateCurrentThreshold(startTime) {
    if (!startTime) return INITIAL_THRESHOLD;
    const elapsed = Date.now() - parseInt(startTime, 10);
    const intervals = Math.floor(elapsed / (10 * 60 * 1000)); // 10-minute intervals
    return INITIAL_THRESHOLD + intervals * 500;
}