// =============================================================================
// roomManager.js — In-memory room state + MongoDB persistence for Scribbl.io
// =============================================================================

const Room = require("./models/Room");

// In-memory store for active rooms (hot game state)
const rooms = new Map();

/**
 * Generate a random 6-character room ID
 */
function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Create a new room and return the room state object
 * @param {string} hostId - Socket ID of the host player
 * @param {string} hostName - Display name of the host
 * @returns {object} room state
 */
function createRoom(hostId, hostName) {
  let roomId = generateRoomId();
  // Ensure unique ID
  while (rooms.has(roomId)) {
    roomId = generateRoomId();
  }

  const room = {
    roomId,
    players: [
      {
        playerId: hostId,
        playerName: hostName,
        score: 0,
        isHost: true,
      },
    ],
    scores: {},
    status: "waiting", // "waiting" | "choosingWord" | "playing" | "roundEnd" | "finished"
    currentRound: 0,
    maxRounds: 3,
    currentWord: "",
    currentDrawer: null,
    currentDrawerIndex: -1,
    wordChoices: [],
    guessedPlayers: [], // playerIds who guessed correctly this turn
    timer: null,
    timeLeft: 0,
    turnStartTime: null,
    maxTurnTime: 60,
  };

  room.scores[hostId] = 0;
  rooms.set(roomId, room);

  // Persist to MongoDB (fire-and-forget)
  Room.create({
    roomId,
    players: [{ playerId: hostId, playerName: hostName, score: 0, isHost: true }],
    status: "waiting",
    maxRounds: 3,
    scores: { [hostId]: 0 },
  }).catch((err) => console.error("DB: Failed to persist room creation:", err.message));

  return room;
}

/**
 * Add a player to an existing room
 * @param {string} roomId
 * @param {string} playerId - Socket ID
 * @param {string} playerName
 * @returns {object|null} room state or null if room doesn't exist
 */
function joinRoom(roomId, playerId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return null;

  // Check if player is already in the room (reconnect scenario)
  const existing = room.players.find((p) => p.playerId === playerId);
  if (existing) return room;

  // Cap at 8 players
  if (room.players.length >= 8) return null;

  room.players.push({
    playerId,
    playerName,
    score: 0,
    isHost: false,
  });

  room.scores[playerId] = 0;

  // Persist to MongoDB
  Room.findOneAndUpdate(
    { roomId },
    {
      $push: { players: { playerId, playerName, score: 0, isHost: false } },
      $set: { [`scores.${playerId}`]: 0 },
    }
  ).catch((err) => console.error("DB: Failed to persist player join:", err.message));

  return room;
}

/**
 * Remove a player from a room
 * @param {string} roomId
 * @param {string} playerId
 * @returns {object|null} updated room or null
 */
function leaveRoom(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.players = room.players.filter((p) => p.playerId !== playerId);
  delete room.scores[playerId];

  // If room is empty, clean it up
  if (room.players.length === 0) {
    if (room.timer) clearInterval(room.timer);
    rooms.delete(roomId);
    // Mark room as finished in DB
    Room.findOneAndUpdate({ roomId }, { status: "finished" })
      .catch((err) => console.error("DB: Failed to update empty room:", err.message));
    return null;
  }

  // If the host left, assign a new host
  if (!room.players.some((p) => p.isHost)) {
    room.players[0].isHost = true;
  }

  // Persist player removal to MongoDB
  Room.findOneAndUpdate(
    { roomId },
    {
      $pull: { players: { playerId } },
      $unset: { [`scores.${playerId}`]: "" },
    }
  ).catch((err) => console.error("DB: Failed to persist player leave:", err.message));

  return room;
}

/**
 * Get room by ID
 * @param {string} roomId
 * @returns {object|null}
 */
function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Find which room a player is in
 * @param {string} playerId
 * @returns {object|null}
 */
function getRoomByPlayerId(playerId) {
  for (const [, room] of rooms) {
    if (room.players.some((p) => p.playerId === playerId)) {
      return room;
    }
  }
  return null;
}

/**
 * Get sanitized room data safe to send to clients (excludes the actual word for guessers)
 * @param {object} room
 * @param {string} [excludeWordForPlayerId] - if provided, hides the word from this player
 * @returns {object}
 */
function getSafeRoomData(room, requesterId) {
  const isDrawer = room.currentDrawer === requesterId;
  return {
    roomId: room.roomId,
    players: room.players,
    status: room.status,
    currentRound: room.currentRound,
    maxRounds: room.maxRounds,
    currentDrawer: room.currentDrawer,
    currentWord: isDrawer ? room.currentWord : null,
    wordLength: room.currentWord ? room.currentWord.length : 0,
    guessedPlayers: room.guessedPlayers,
    timeLeft: room.timeLeft,
    maxTurnTime: room.maxTurnTime,
    scores: room.scores,
  };
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomByPlayerId,
  getSafeRoomData,
  generateRoomId,
};
