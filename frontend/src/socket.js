// =============================================================================
// socket.js — Singleton Socket.IO client for Scribbl.io
// =============================================================================

import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

const socket = io(SERVER_URL, {
  autoConnect: false, // connect manually when joining a room
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Debug logging
socket.on("connect", () => {
  console.log("🔌 Connected to server:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("🔌 Connection error:", err.message);
});

export default socket;
