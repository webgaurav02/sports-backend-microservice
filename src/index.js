require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const bookingRoutes = require('./routes/bookingRoute');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.use(bookingRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Booking Service running on port ${PORT}`));

// Start the reservation worker
require('./workers/reservationWorker');