// src/controllers/ticketReleaseController.js
const MatchAvailability = require('../models/MatchAvailability');
const Section = require('../models/Section');
const redisClient = require('../config/redis');
const { publishSeatUpdate } = require('../socket');

const { Types: { ObjectId } } = require('mongoose');
/**
 * POST /api/tickets/release/multi
 * Request body: { matchId, sections: [{ sectionId, availableQuantity, price, lockedSeats, gate, entry }] }
 *
 * This endpoint updates the MatchAvailability document for each section in the provided list,
 * using the Mongo _id from the Sections collection (found by matching sectionId).
 * It also populates Redis with the new available ticket count for that match.
 */
exports.releaseTicketsForSections = async (req, res) => {

    // const secret = req.headers['x-ticket-release-secret'];
    // if (secret !== process.env.SECRET) {
    //     return res.status(401).json({ success: false, error: 'Unauthorized' });
    // }

    const { matchId, sections } = req.body;

    // console.log( matchId, sections )

    if (!matchId || !Array.isArray(sections)) {
        return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    try {
        // Process all sections in parallel using an async callback
        const updatePromises = sections.map(async ({ sectionId, availableQuantity, price, lockedSeats, gate, entry }) => {
            if (!sectionId || typeof availableQuantity !== 'number') {
                throw new Error('Invalid section data');
            }

            // Ensure availableQuantity is an integer
            const quantity = Math.floor(availableQuantity);

            // Look up the section document by matching sectionId field in the Sections collection
            const sectionDoc = await Section.findOne({ sectionID: sectionId });


            if (!sectionDoc) {
                throw new Error(`Section not found for sectionId: ${sectionId}`);
            }

            // Construct the Redis key for this section
            const availableKey = `available:match:${matchId}:section:${sectionDoc._id}`;

            // Optionally, delete any existing key to ensure it's clean
            await redisClient.del(availableKey);

            // Update the database record for this section:
            const dbUpdatePromise = MatchAvailability.findOneAndUpdate(
                { matchID: matchId, section: sectionDoc._id },
                {
                    $set: {
                        section: new ObjectId(sectionDoc._id),
                        availableQuantity: quantity, // use the integer value
                        lockedSeats: 0,              // always reset locked seats to 0 here
                        gate: gate,
                        entry: entry,
                        price: price,
                    }
                },
                { new: true, upsert: true } // Create the record if it doesn't exist
            ).exec();

            // Update Redis with the new available quantity as a string using quantity
            const redisUpdatePromise = redisClient.set(availableKey, quantity.toString());

            // Wait for both updates to complete
            const [updatedAvailability] = await Promise.all([dbUpdatePromise, redisUpdatePromise]);

            // Publish a real-time seat update for this section
            publishSeatUpdate(matchId, sectionDoc._id);

            return updatedAvailability;
        });

        // Wait for all section updates to complete
        const updatedSections = await Promise.all(updatePromises);

        return res.json({ success: true, updatedSections });
    } catch (error) {
        console.error("Error releasing tickets for sections:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};