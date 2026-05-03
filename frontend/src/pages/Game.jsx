// =============================================================================
// Game.jsx — Main game page for Scribbl.io
// Manages game state, socket events, and composes all game components
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import socket from "../socket";
import Canvas from "../components/Canvas";
import Toolbar from "../components/Toolbar";
import Chat from "../components/Chat";
import WordSelector from "../components/WordSelector";
import GameHeader from "../components/GameHeader";
import PlayerList from "../components/PlayerList";
import GameOver from "../components/GameOver";
import "./Game.css";

export default function Game({ roomData, playerId, onLeave }) {
  // ─── State ──────────────────────────────────────────────────────────────
  const [room, setRoom] = useState(roomData);
  const [players, setPlayers] = useState(roomData.players || []);
  const [scores, setScores] = useState(roomData.scores || {});
  const [status, setStatus] = useState(roomData.status || "waiting");
  const [currentDrawer, setCurrentDrawer] = useState(roomData.currentDrawer);
  const [currentRound, setCurrentRound] = useState(roomData.currentRound || 0);
  const [maxRounds, setMaxRounds] = useState(roomData.maxRounds || 3);
  const [timeLeft, setTimeLeft] = useState(roomData.timeLeft || 0);
  const [hint, setHint] = useState("");
  const [word, setWord] = useState("");
  const [wordChoices, setWordChoices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [gameOverData, setGameOverData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);

  const isHost = players.find((p) => p.playerId === playerId)?.isHost || false;
  const isDrawer = currentDrawer === playerId;
  const roomId = room.roomId;

  // ─── Socket event listeners ─────────────────────────────────────────────
  useEffect(() => {
    const onPlayerJoined = ({ player, playerCount }) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.playerId === player.playerId)) return prev;
        return [...prev, player];
      });
    };

    const onPlayerLeft = ({ playerId: leftId, playerCount }) => {
      setPlayers((prev) => prev.filter((p) => p.playerId !== leftId));
    };

    const onGameStarted = ({ round, maxRounds: mr }) => {
      setStatus("playing");
      setCurrentRound(round);
      setMaxRounds(mr);
      setGameOverData(null);
    };

    const onChooseWord = ({ words }) => {
      setWordChoices(words);
    };

    const onTurnStarted = ({ drawer, drawerName, round, maxRounds: mr, wordLength, timeLeft: tl }) => {
      setCurrentDrawer(drawer);
      setCurrentRound(round);
      setMaxRounds(mr);
      setTimeLeft(tl);
      setWord("");
      setHint("_".repeat(wordLength || 0));
      setWordChoices([]);
      setStatus("choosingWord");
    };

    const onWordToDraw = ({ word: w }) => {
      setWord(w);
      setStatus("playing");
    };

    const onDrawingStarted = ({ drawer, drawerName, wordLength, hint: h, timeLeft: tl }) => {
      setCurrentDrawer(drawer);
      setHint(h);
      setTimeLeft(tl);
      setStatus("playing");
      if (!isDrawer) setWordChoices([]);
    };

    const onTimerUpdate = ({ timeLeft: tl }) => {
      setTimeLeft(tl);
    };

    const onHintUpdate = ({ hint: h }) => {
      setHint(h);
    };

    const onScoreUpdate = ({ scores: s }) => {
      setScores(s);
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          score: s[p.playerId] ?? p.score,
        }))
      );
    };

    const onCorrectGuess = ({ playerId: gId, playerName, points }) => {
      // Handled via chat messages + score updates
    };

    const onTurnEnded = ({ word: w, scores: s }) => {
      setWord(w);
      setStatus("roundEnd");
      if (s) setScores(s);
    };

    const onRoundStarted = ({ round, maxRounds: mr }) => {
      setCurrentRound(round);
      setMaxRounds(mr);
    };

    const onGameOver = (data) => {
      setStatus("finished");
      setGameOverData(data);
    };

    const onChatMessage = (msg) => {
      setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }]);
    };

    // Register all listeners
    socket.on("player_joined", onPlayerJoined);
    socket.on("player_left", onPlayerLeft);
    socket.on("game_started", onGameStarted);
    socket.on("choose_word", onChooseWord);
    socket.on("turn_started", onTurnStarted);
    socket.on("word_to_draw", onWordToDraw);
    socket.on("drawing_started", onDrawingStarted);
    socket.on("timer_update", onTimerUpdate);
    socket.on("hint_update", onHintUpdate);
    socket.on("score_update", onScoreUpdate);
    socket.on("correct_guess", onCorrectGuess);
    socket.on("turn_ended", onTurnEnded);
    socket.on("round_started", onRoundStarted);
    socket.on("game_over", onGameOver);
    socket.on("chat_message", onChatMessage);

    return () => {
      socket.off("player_joined", onPlayerJoined);
      socket.off("player_left", onPlayerLeft);
      socket.off("game_started", onGameStarted);
      socket.off("choose_word", onChooseWord);
      socket.off("turn_started", onTurnStarted);
      socket.off("word_to_draw", onWordToDraw);
      socket.off("drawing_started", onDrawingStarted);
      socket.off("timer_update", onTimerUpdate);
      socket.off("hint_update", onHintUpdate);
      socket.off("score_update", onScoreUpdate);
      socket.off("correct_guess", onCorrectGuess);
      socket.off("turn_ended", onTurnEnded);
      socket.off("round_started", onRoundStarted);
      socket.off("game_over", onGameOver);
      socket.off("chat_message", onChatMessage);
    };
  }, [playerId]);

  // ─── Actions ────────────────────────────────────────────────────────────
  const handleStartGame = () => {
    socket.emit("start_game", { roomId });
  };

  const handleSelectWord = (word) => {
    socket.emit("word_selected", { roomId, word });
    setWordChoices([]);
  };

  const handleSendMessage = (message) => {
    if (!message.trim()) return;
    socket.emit("send_message", { roomId, message: message.trim() });
  };

  const handleClearCanvas = () => {
    socket.emit("clear_canvas", { roomId });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="game">
      {/* Top bar */}
      <GameHeader
        status={status}
        currentRound={currentRound}
        maxRounds={maxRounds}
        isDrawer={isDrawer}
        word={word}
        hint={hint}
        timeLeft={timeLeft}
        roomId={roomId}
      />

      {/* Main layout */}
      <div className="game-main">
        {/* Left sidebar — Player list */}
        <div className="game-sidebar-left">
          <PlayerList
            players={players}
            scores={scores}
            currentDrawer={currentDrawer}
            myPlayerId={playerId}
          />
        </div>

        {/* Center — Canvas area */}
        <div className="game-center">
          {status === "waiting" ? (
            /* Waiting room */
            <div className="waiting-room">
              <h2>
                <span className="gradient-text">Waiting for players...</span>
              </h2>

              <div className="room-code-display">
                <label>Share this code with friends</label>
                <div
                  className="room-code-box"
                  onClick={copyRoomCode}
                  title="Click to copy"
                >
                  <span className="code-text gradient-text">{roomId}</span>
                </div>
              </div>

              <div className="waiting-players">
                <div className="player-count">
                  {players.length} player{players.length !== 1 ? "s" : ""} in lobby
                </div>
                <div className="waiting-player-list">
                  {players.map((p) => (
                    <div
                      key={p.playerId}
                      className={`waiting-player-chip ${p.isHost ? "is-host" : ""}`}
                    >
                      <span>{p.playerName}</span>
                      {p.isHost && <span className="host-badge">HOST</span>}
                    </div>
                  ))}
                </div>
              </div>

              {isHost ? (
                <button
                  id="start-game-btn"
                  className="btn btn-primary start-game-btn"
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                >
                  {players.length < 2
                    ? "Need at least 2 players"
                    : "🎮 Start Game"}
                </button>
              ) : (
                <p className="waiting-hint">
                  Waiting for the host to start the game...
                </p>
              )}
            </div>
          ) : (
            /* Canvas area — placeholder until Phase 3 */
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}>
              {/* Word selector for drawer */}
              <WordSelector
                wordChoices={wordChoices}
                onSelectWord={handleSelectWord}
                isDrawer={isDrawer}
              />

              {/* Drawing Area */}
              <Canvas
                roomId={roomId}
                isDrawer={isDrawer}
                color={brushColor}
                brushSize={brushSize}
              />
              <Toolbar
                isDrawer={isDrawer}
                color={brushColor}
                setColor={setBrushColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                onClear={handleClearCanvas}
              />
            </div>
          )}
        </div>

        {/* Right sidebar — Chat */}
        <div className="game-sidebar-right">
          <Chat
            messages={messages}
            onSendMessage={handleSendMessage}
            isDrawer={isDrawer}
            status={status}
          />
        </div>
      </div>

      {/* Copied toast */}
      {copied && <div className="copied-toast">✅ Room code copied!</div>}

      {/* Game over overlay */}
      {status === "finished" && (
        <GameOver
          gameOverData={gameOverData}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}
