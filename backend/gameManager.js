// =============================================================================
// gameManager.js — Game logic, scoring, and turn management for Scribbl.io
// =============================================================================

const { getRandomWords } = require("./words");
const { getRoom } = require("./roomManager");
const GameHistory = require("./models/GameHistory");
const Room = require("./models/Room");

const BASE_GUESS_POINTS = 100;
const MAX_SPEED_BONUS = 150;
const DRAWER_POINTS_PER_GUESS = 25;
const TURN_DURATION = 60;
const WORD_CHOOSE_DURATION = 15;

function startGame(roomId, io) {
  const room = getRoom(roomId);
  if (!room || room.players.length < 2) return null;

  room.players.forEach((p) => {
    p.score = 0;
    room.scores[p.playerId] = 0;
  });

  room.currentRound = 1;
  room.currentDrawerIndex = -1;
  room.status = "playing";

  nextTurn(roomId, io);
  return room;
}

function nextTurn(roomId, io) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.timer) { clearInterval(room.timer); room.timer = null; }

  room.currentDrawerIndex++;

  if (room.currentDrawerIndex >= room.players.length) {
    room.currentDrawerIndex = 0;
    room.currentRound++;

    if (room.currentRound > room.maxRounds) {
      endGame(roomId, io);
      return;
    }

    io.to(roomId).emit("round_started", {
      round: room.currentRound,
      maxRounds: room.maxRounds,
    });
  }

  const drawer = room.players[room.currentDrawerIndex];
  room.currentDrawer = drawer.playerId;
  room.currentWord = "";
  room.guessedPlayers = [];
  room.status = "choosingWord";

  const wordChoices = getRandomWords(3);
  room.wordChoices = wordChoices;

  io.to(drawer.playerId).emit("choose_word", { words: wordChoices });

  io.to(roomId).emit("turn_started", {
    drawer: drawer.playerId,
    drawerName: drawer.playerName,
    round: room.currentRound,
    maxRounds: room.maxRounds,
    wordLength: 0,
    timeLeft: WORD_CHOOSE_DURATION,
  });

  room.timeLeft = WORD_CHOOSE_DURATION;
  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(roomId).emit("timer_update", { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;
      if (room.status === "choosingWord") {
        selectWord(roomId, room.wordChoices[0], io);
      }
    }
  }, 1000);
}

function selectWord(roomId, word, io) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.timer) { clearInterval(room.timer); room.timer = null; }

  room.currentWord = word.toLowerCase();
  room.status = "playing";
  room.turnStartTime = Date.now();
  room.timeLeft = TURN_DURATION;

  io.to(room.currentDrawer).emit("word_to_draw", { word: room.currentWord });

  const hint = room.currentWord.split("").map((ch) => (ch === " " ? " " : "_")).join("");
  const drawerPlayer = room.players.find((p) => p.playerId === room.currentDrawer);

  io.to(roomId).emit("drawing_started", {
    drawer: room.currentDrawer,
    drawerName: drawerPlayer?.playerName,
    wordLength: room.currentWord.length,
    hint,
    timeLeft: TURN_DURATION,
  });

  let hintRevealCount = 0;
  const maxHints = Math.floor(room.currentWord.replace(/ /g, "").length / 3);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(roomId).emit("timer_update", { timeLeft: room.timeLeft });

    if (room.timeLeft > 0 && hintRevealCount < maxHints && room.timeLeft % 20 === 0) {
      hintRevealCount++;
      const currentHint = generateHint(room.currentWord, hintRevealCount);
      io.to(roomId).emit("hint_update", { hint: currentHint });
    }

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;
      endTurn(roomId, io);
    }
  }, 1000);
}

function handleGuess(roomId, playerId, message, io) {
  const room = getRoom(roomId);
  if (!room || room.status !== "playing") return { correct: false };
  if (playerId === room.currentDrawer) return { correct: false };
  if (room.guessedPlayers.includes(playerId)) return { correct: false, alreadyGuessed: true };

  const guess = message.trim().toLowerCase();
  const word = room.currentWord.toLowerCase();

  if (guess === word) {
    room.guessedPlayers.push(playerId);

    const elapsed = (Date.now() - room.turnStartTime) / 1000;
    const timeRatio = Math.max(0, 1 - elapsed / TURN_DURATION);
    const speedBonus = Math.round(MAX_SPEED_BONUS * timeRatio);
    const guesserPoints = BASE_GUESS_POINTS + speedBonus;

    const guesser = room.players.find((p) => p.playerId === playerId);
    if (guesser) { guesser.score += guesserPoints; room.scores[playerId] = guesser.score; }

    const drawer = room.players.find((p) => p.playerId === room.currentDrawer);
    if (drawer) { drawer.score += DRAWER_POINTS_PER_GUESS; room.scores[room.currentDrawer] = drawer.score; }

    io.to(roomId).emit("correct_guess", { playerId, playerName: guesser?.playerName, points: guesserPoints });
    io.to(roomId).emit("score_update", { scores: room.scores });

    const nonDrawers = room.players.filter((p) => p.playerId !== room.currentDrawer);
    if (room.guessedPlayers.length >= nonDrawers.length) {
      if (room.timer) { clearInterval(room.timer); room.timer = null; }
      setTimeout(() => endTurn(roomId, io), 2000);
    }

    return { correct: true };
  }

  if (isCloseGuess(guess, word)) return { correct: false, close: true };
  return { correct: false, close: false };
}

function endTurn(roomId, io) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.timer) { clearInterval(room.timer); room.timer = null; }
  room.status = "roundEnd";

  io.to(roomId).emit("turn_ended", { word: room.currentWord, scores: room.scores });
  setTimeout(() => nextTurn(roomId, io), 4000);
}

function endGame(roomId, io) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.timer) { clearInterval(room.timer); room.timer = null; }
  room.status = "finished";

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  io.to(roomId).emit("game_over", {
    scores: room.scores,
    winner: { playerId: winner.playerId, playerName: winner.playerName, score: winner.score },
    standings: sortedPlayers.map((p) => ({ playerId: p.playerId, playerName: p.playerName, score: p.score })),
  });

  // Persist game results to MongoDB
  GameHistory.create({
    roomId,
    players: sortedPlayers.map((p) => ({ playerName: p.playerName, score: p.score })),
    winner: { playerName: winner.playerName, score: winner.score },
    rounds: room.maxRounds,
  }).catch((err) => console.error("DB: Failed to save game history:", err.message));

  // Update room status in DB
  Room.findOneAndUpdate(
    { roomId },
    { status: "finished", scores: room.scores }
  ).catch((err) => console.error("DB: Failed to update room status:", err.message));
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function generateHint(word, revealCount) {
  const letters = word.split("");
  const nonSpaceIndices = letters.map((ch, i) => (ch !== " " ? i : -1)).filter((i) => i !== -1);
  const shuffled = [...nonSpaceIndices].sort((a, b) => hashChar(word, a) - hashChar(word, b));
  const revealIndices = new Set(shuffled.slice(0, revealCount));
  return letters.map((ch, i) => { if (ch === " ") return " "; return revealIndices.has(i) ? ch : "_"; }).join("");
}

function hashChar(word, index) {
  return ((word.charCodeAt(index) * 31 + index * 17) % 997) / 997;
}

function isCloseGuess(guess, word) {
  if (Math.abs(guess.length - word.length) > 1) return false;
  let diffs = 0;
  for (let i = 0; i < Math.max(guess.length, word.length); i++) {
    if (guess[i] !== word[i]) { diffs++; if (diffs > 1) return false; }
  }
  return diffs === 1;
}

module.exports = { startGame, nextTurn, selectWord, handleGuess, endTurn, endGame, TURN_DURATION, WORD_CHOOSE_DURATION };
