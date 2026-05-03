// =============================================================================
// models/Room.js — Mongoose schema for persisted room data
// =============================================================================

const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    score: { type: Number, default: 0 },
    isHost: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  players: [playerSchema],
  status: {
    type: String,
    enum: ["waiting", "choosingWord", "playing", "roundEnd", "finished"],
    default: "waiting",
  },
  currentRound: { type: Number, default: 0 },
  maxRounds: { type: Number, default: 3 },
  currentWord: { type: String, default: "" },
  currentDrawer: { type: String, default: null },
  scores: { type: Map, of: Number, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update the updatedAt timestamp
roomSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Auto-update on findOneAndUpdate
roomSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
