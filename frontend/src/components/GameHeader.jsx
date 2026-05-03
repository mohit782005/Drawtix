// =============================================================================
// GameHeader.jsx — Top bar with timer, round info, and word display
// =============================================================================

import { useState } from "react";
import "./GameHeader.css";

export default function GameHeader({
  status,
  currentRound,
  maxRounds,
  isDrawer,
  word,
  hint,
  timeLeft,
  roomId
}) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isUrgent = timeLeft <= 10 && status === "playing";

  return (
    <div className="game-header">
      <div className="header-left">
        <span className="header-logo gradient-text">Scribbl.io</span>
        {status !== "waiting" && (
          <span className="round-badge">
            Round {currentRound}/{maxRounds}
          </span>
        )}
      </div>

      <div className="header-center">
        {status === "playing" && (
          <div className="word-display">
            {isDrawer ? word : hint.split("").join(" ")}
          </div>
        )}
        {status === "roundEnd" && (
          <div className="word-reveal">
            The word was: <strong>{word}</strong>
          </div>
        )}
      </div>

      <div className="header-right">
        {status !== "waiting" && status !== "finished" && (
          <div className={`timer-container ${isUrgent ? "urgent" : ""}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{timeLeft}</span>
          </div>
        )}

        <div className="room-code-badge" onClick={copyRoomCode} title="Click to copy">
          <span>{copied ? "✅" : "🔗"}</span>
          <span className="code">{roomId}</span>
        </div>
      </div>
    </div>
  );
}
