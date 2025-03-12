// src/controllers/matchAvailabilityController.js
const Match = require('../models/Match');

const getMatchData = async (req, res) => {
  try {
    
    const { matchId } = req.params;

    const matchDetails = await Match.findById( matchId );
    res.status(200).json({ matchDetails });
  } catch (error) {
    console.error("Error fetching match availability:", error);
    res.status(500).json({ error: "Failed to fetch match availability" });
  }
};


module.exports = { getMatchData };