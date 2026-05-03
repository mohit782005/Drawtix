// =============================================================================
// App.jsx — Root component with state-based routing for Scribbl.io
// =============================================================================

import { useState, useCallback } from "react";
import Home from "./pages/Home";
import Game from "./pages/Game";
import socket from "./socket";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home"); // "home" | "game"
  const [gameData, setGameData] = useState(null);

  const handleJoinGame = useCallback((data) => {
    setGameData(data);
    setPage("game");
  }, []);

  const handleLeaveGame = useCallback(() => {
    socket.disconnect();
    setGameData(null);
    setPage("home");
  }, []);

  return (
    <div className="app">
      {page === "home" && <Home onJoinGame={handleJoinGame} />}
      {page === "game" && gameData && (
        <Game
          roomData={gameData.room}
          playerId={gameData.playerId}
          onLeave={handleLeaveGame}
        />
      )}
    </div>
  );
}
