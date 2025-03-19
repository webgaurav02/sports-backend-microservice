// models/Ticket.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TicketSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  ticketNumber: { type: String, required: true },
  userId: { type: String },
  generatedAt: { type: Date, default: Date.now },
  imageUrl: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
  emailSent: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
});

module.exports = mongoose.model('Ticket', TicketSchema);