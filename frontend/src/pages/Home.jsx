// =============================================================================
// Home.jsx — Landing / Lobby page for Scribbl.io
// =============================================================================

import { useState } from "react";
import socket from "../socket";
import "./Home.css";

export default function Home({ onJoinGame }) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const connectAndJoin = (roomId) => {
    if (!playerName.trim()) {
      setError("Please enter your name!");
      return;
    }

    setError("");
    setIsConnecting(true);
    setConnectionStatus("connecting");

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setConnectionStatus("connected");
      socket.emit("join_room", {
        roomId: roomId || null,
        playerName: playerName.trim(),
      });
    };

    const handleRoomJoined = (data) => {
      setIsConnecting(false);
      cleanup();
      onJoinGame(data);
    };

    const handleError = (data) => {
      setIsConnecting(false);
      setError(data.message || "Something went wrong");
      cleanup();
    };

    const handleConnectError = () => {
      setIsConnecting(false);
      setConnectionStatus("disconnected");
      setError("Cannot connect to server. Is the backend running?");
      cleanup();
    };

    const cleanup = () => {
      socket.off("room_joined", handleRoomJoined);
      socket.off("error_message", handleError);
      socket.off("connect_error", handleConnectError);
      socket.off("connect", handleConnect);
    };

    socket.on("connect", handleConnect);
    socket.on("room_joined", handleRoomJoined);
    socket.on("error_message", handleError);
    socket.on("connect_error", handleConnectError);

    // If already connected, emit directly
    if (socket.connected) {
      handleConnect();
    }
  };

  const handleCreateRoom = () => {
    connectAndJoin(null);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setError("Please enter a room code!");
      return;
    }
    connectAndJoin(roomCode.trim().toUpperCase());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (roomCode.trim()) {
        handleJoinRoom();
      } else {
        handleCreateRoom();
      }
    }
  };

  return (
    <div className="home">
      {/* Animated background orbs */}
      <div className="home-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Main card */}
      <div className="home-card">
        <div className="home-logo">
          <span className="logo-icon">🎨</span>
          <h1>
            <span className="gradient-text">Scribbl.io</span>
          </h1>
          <p className="tagline">Draw, Guess, Win!</p>
        </div>

        <div className="home-form">
          {/* Player name input */}
          <div className="input-group">
            <label htmlFor="player-name">Your Name</label>
            <input
              id="player-name"
              className="input-field"
              type="text"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              autoFocus
            />
          </div>

          {/* Error */}
          {error && <div className="error-message">{error}</div>}

          {/* Create room button */}
          <div className="home-actions">
            <button
              id="create-room-btn"
              className="btn btn-primary"
              onClick={handleCreateRoom}
              disabled={isConnecting || !playerName.trim()}
            >
              {isConnecting ? "Connecting..." : "🚀 Create Room"}
            </button>
          </div>

          {/* Divider */}
          <div className="divider">or join a room</div>

          {/* Join room */}
          <div className="join-row">
            <input
              id="room-code-input"
              className="input-field"
              type="text"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              maxLength={6}
            />
            <button
              id="join-room-btn"
              className="btn btn-secondary"
              onClick={handleJoinRoom}
              disabled={isConnecting || !playerName.trim() || !roomCode.trim()}
            >
              Join
            </button>
          </div>
        </div>

        {/* Connection status */}
        <div className="connection-status">
          <span className={`status-dot ${connectionStatus}`} />
          <span>
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "connecting"
              ? "Connecting..."
              : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}
