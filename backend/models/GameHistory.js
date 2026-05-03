// =============================================================================
// models/GameHistory.js — Mongoose schema for completed game results
// =============================================================================

const mongoose = require("mongoose");

const gameHistorySchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  players: [
    {
      playerName: { type: String, required: true },
      score: { type: Number, required: true },
      _id: false,
    },
  ],
  winner: {
    playerName: { type: String, required: true },
    score: { type: Number, required: true },
  },
  rounds: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

const GameHistory = mongoose.model("GameHistory", gameHistorySchema);

module.exports = GameHistory;
