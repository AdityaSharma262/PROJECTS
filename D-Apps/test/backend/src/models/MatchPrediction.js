const mongoose = require('mongoose');

const matchPredictionSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true
  },
  matchId: {
    type: String,
    required: true
  },
  team: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Enforce ONE prediction per wallet per match using a compound unique index
matchPredictionSchema.index({ wallet: 1, matchId: 1 }, { unique: true });

const MatchPrediction = mongoose.model('MatchPrediction', matchPredictionSchema);

module.exports = MatchPrediction;