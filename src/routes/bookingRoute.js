const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const sectionController = require('../controllers/sectionController');
const matchController = require('../controllers/matchController');
const timeController = require('../controllers/timeController');
const queueController = require("../controllers/queueController");
const ticketReleaseController = require('../controllers/ticketReleaseController');



// const authMiddleware = require('../middlewares/authMiddleware'); // Uncomment if using JWT auth

// Endpoint to get match data
router.get('/api/match/matchData/:matchId/', /* authMiddleware, */ matchController.getMatchData);

// Endpoint to get available seats and sections for a match
router.get('/api/sections/availability', sectionController.getSectionsWithAvailability);

// HTTP request to get server time
router.get('/api/time', timeController.getCurrentTime);

//Endpoint to add to queue and book
// router.post('/api/booking/book-ticket', bookingController.enqueueBooking);

// Route to enter the queue
router.post("/api/queue/enter", queueController.enterQueue);
// Route to check queue status (pass your rank as a query parameter)
router.get("/api/queue/status", queueController.queueStatus);


router.post('/api/check-and-lock', bookingController.checkAndLockSeats);


// Set Quantities
router.post('/api/tickets/release/multi', ticketReleaseController.releaseTicketsForSections);


module.exports = router;