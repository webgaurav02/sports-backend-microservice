require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const bookingRoutes = require('./routes/bookingRoute');
const { initSocket } = require('./socket');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.use(bookingRoutes);

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Booking Service running on port ${PORT}`));

// Start the reservation worker
require('./workers/reservationWorker');