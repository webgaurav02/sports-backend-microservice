// src/controllers/sectionController.js
const mongoose = require('mongoose');
const Section = require('../models/Section');

exports.getSectionsWithAvailability = async (req, res) => {

  // console.log("Here!")

  try {
    const { matchId } = req.query;
    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required.' });
    }

    // Convert matchId to ObjectId (assuming matchID is stored as ObjectId)
    const matchObjectId = new mongoose.Types.ObjectId(matchId);

    // Aggregate sections and join with matchAvailability collection
    const sectionsWithAvailability = await Section.aggregate([
      {
        $lookup: {
          from: "matchavailabilities", // collection name for MatchAvailability (default lower-case, plural)
          let: { sectionId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$section", "$$sectionId"] },
                    { $eq: ["$matchID", matchObjectId] }
                  ]
                }
              }
            },
            // Project only needed fields from MatchAvailability
            { $project: { availableQuantity: 1, lockedSeats: 1, price: 1, _id: 0 } }
          ],
          as: "availability"
        }
      },
      {
        // Unwind the availability array; if no matching availability, keep the section with defaults
        $unwind: {
          path: "$availability",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // Add fields to the section document; if no availability, default values are provided.
        $addFields: {
          availableQuantity: { $ifNull: ["$availability.availableQuantity", 0] },
          lockedSeats: { $ifNull: ["$availability.lockedSeats", 0] },
          matchPrice: { $ifNull: ["$availability.price", "$price"] } // fallback to Section's static price
        }
      },
      {
        // Remove the temporary "availability" field
        $project: { availability: 0 }
      }
    ]);

    res.status(200).json({ sections: sectionsWithAvailability });
  } catch (error) {
    console.error("Error fetching sections with availability:", error);
    res.status(500).json({ error: "Failed to fetch sections with availability." });
  }
};