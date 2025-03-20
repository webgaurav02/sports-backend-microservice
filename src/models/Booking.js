const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  name: { type: String },
  userId: { type: String },
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  sectionId: { type: String, required: true, ref: 'Section', },
  numberOfSeats: { type: Number },
  transactionId: { type: String },
  orderId: { type: String, unique: true },
  baseAmt: { type: Number },
  convenienceFee: { type: Number },
  platformFee: { type: Number },
  gst: { type: Number },
  totalAmount: { type: Number },
  paymentId: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  lockExpiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);