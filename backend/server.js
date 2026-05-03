// =============================================================================
// server.js — Scribbl.io Backend Entry Point
// Express + Socket.IO server with all real-time event handlers
// =============================================================================

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const {
  createRoom, joinRoom, leaveRoom,
  getRoom, getRoomByPlayerId, getSafeRoomData,
} = require("./roomManager");

const {
  startGame, selectWord, handleGuess,
} = require("./gameManager");

const { connectDB } = require("./db");

// ─── SERVER SETUP ───────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", game: "Scribbl.io", uptime: process.uptime() });
});

// ─── SOCKET.IO CONNECTION ───────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`⚡ Player connected: ${socket.id}`);

  // ── JOIN ROOM ─────────────────────────────────────────────────────────
  socket.on("join_room", ({ roomId, playerName }) => {
    if (!playerName || playerName.trim().length === 0) {
      socket.emit("error_message", { message: "Player name is required" });
      return;
    }

    let room;

    if (roomId) {
      // Join existing room
      room = joinRoom(roomId, socket.id, playerName.trim());
      if (!room) {
        socket.emit("error_message", { message: "Room not found or is full" });
        return;
      }
    } else {
      // Create new room
      room = createRoom(socket.id, playerName.trim());
    }

    socket.join(room.roomId);

    // Confirm join to the player
    socket.emit("room_joined", {
      room: getSafeRoomData(room, socket.id),
      playerId: socket.id,
    });

    // Notify others in the room
    socket.to(room.roomId).emit("player_joined", {
      player: {
        playerId: socket.id,
        playerName: playerName.trim(),
        score: 0,
      },
      playerCount: room.players.length,
    });

    // System message in chat
    io.to(room.roomId).emit("chat_message", {
      playerName: "System",
      message: `${playerName.trim()} joined the room!`,
      type: "system",
    });

    console.log(`🚪 ${playerName} joined room ${room.roomId} (${room.players.length} players)`);
  });

  // ── START GAME ────────────────────────────────────────────────────────
  socket.on("start_game", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;

    // Only the host can start the game
    const player = room.players.find((p) => p.playerId === socket.id);
    if (!player || !player.isHost) {
      socket.emit("error_message", { message: "Only the host can start the game" });
      return;
    }

    if (room.players.length < 2) {
      socket.emit("error_message", { message: "Need at least 2 players to start" });
      return;
    }

    io.to(roomId).emit("game_started", {
      round: 1,
      maxRounds: room.maxRounds,
    });

    startGame(roomId, io);
    console.log(`🎮 Game started in room ${roomId}`);
  });

  // ── WORD SELECTED ─────────────────────────────────────────────────────
  socket.on("word_selected", ({ roomId, word }) => {
    const room = getRoom(roomId);
    if (!room || room.currentDrawer !== socket.id) return;
    if (!room.wordChoices.includes(word)) return;

    selectWord(roomId, word, io);
    console.log(`📝 Word selected in room ${roomId}`);
  });

  // ── DRAW ──────────────────────────────────────────────────────────────
  socket.on("draw", ({ roomId, x, y, prevX, prevY, color, size }) => {
    const room = getRoom(roomId);
    if (!room || room.currentDrawer !== socket.id) return;

    // Broadcast to everyone except the drawer
    socket.to(roomId).emit("draw_update", { x, y, prevX, prevY, color, size });
  });

  // ── CLEAR CANVAS ──────────────────────────────────────────────────────
  socket.on("clear_canvas", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.currentDrawer !== socket.id) return;

    io.to(roomId).emit("canvas_cleared");
  });

  // ── SEND MESSAGE (CHAT / GUESS) ───────────────────────────────────────
  socket.on("send_message", ({ roomId, message }) => {
    const room = getRoom(roomId);
    if (!room || !message || message.trim().length === 0) return;

    const player = room.players.find((p) => p.playerId === socket.id);
    if (!player) return;

    // Check if it's a guess
    if (room.status === "playing" && socket.id !== room.currentDrawer) {
      const result = handleGuess(roomId, socket.id, message, io);

      if (result.correct) {
        // Don't broadcast the correct word as a chat message
        return;
      }

      if (result.alreadyGuessed) {
        socket.emit("chat_message", {
          playerName: "System",
          message: "You already guessed correctly!",
          type: "system",
        });
        return;
      }

      if (result.close) {
        socket.emit("chat_message", {
          playerName: "System",
          message: "You're close!",
          type: "close",
        });
      }
    }

    // Broadcast as a normal chat message
    io.to(roomId).emit("chat_message", {
      playerName: player.playerName,
      message: message.trim(),
      type: "chat",
    });
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) {
      console.log(`💨 Player disconnected: ${socket.id}`);
      return;
    }

    const player = room.players.find((p) => p.playerId === socket.id);
    const playerName = player?.playerName || "Unknown";
    const roomId = room.roomId;

    const updatedRoom = leaveRoom(roomId, socket.id);

    if (updatedRoom) {
      io.to(roomId).emit("player_left", {
        playerId: socket.id,
        playerName,
        playerCount: updatedRoom.players.length,
      });

      io.to(roomId).emit("chat_message", {
        playerName: "System",
        message: `${playerName} left the room`,
        type: "system",
      });

      // If the drawer left during an active game, skip to next turn
      if (
        room.currentDrawer === socket.id &&
        (room.status === "playing" || room.status === "choosingWord")
      ) {
        const { nextTurn } = require("./gameManager");
        io.to(roomId).emit("chat_message", {
          playerName: "System",
          message: "The drawer left! Skipping to next turn...",
          type: "system",
        });
        setTimeout(() => nextTurn(roomId, io), 2000);
      }
    }

    console.log(`💨 ${playerName} disconnected from room ${roomId}`);
  });
});

// ─── START SERVER ───────────────────────────────────────────────────────────
async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🎨 Scribbl.io server running on http://localhost:${PORT}\n`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
