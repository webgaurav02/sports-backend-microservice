const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SectionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
});

const MatchSchema = new mongoose.Schema({
  title: { type: String },
  dateTime: { type: Date, required: true },
  releaseDateTime: { type: Date, required: true },
  sections: [SectionSchema],
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  matchNo: { type: Number },
  dateStr: { type: String, required: true },
  time: { type: String, required: true },
  slug: { type: String },
});

module.exports = mongoose.model('Match', MatchSchema);