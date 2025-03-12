const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const sectionController = require('../controllers/sectionController');
const matchController = require('../controllers/matchController');
const timeController = require('../controllers/timeController');
// const authMiddleware = require('../middlewares/authMiddleware'); // Uncomment if using JWT auth

// Endpoint to get match data
router.get('/api/match/matchData/:matchId/', /* authMiddleware, */ matchController.getMatchData);

// Endpoint to get available seats and sections for a match
router.get('/api/sections/availability', sectionController.getSectionsWithAvailability);

// HTTP request to get server time
router.get('/api/time', timeController.getCurrentTime);

module.exports = router;