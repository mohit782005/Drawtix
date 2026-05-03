# Scribbl.io MVP Architecture

## 1. Overview
Scribbl.io is a real-time multiplayer drawing and guessing game.

### Core Gameplay Loop:
1. A player is selected as the "drawer"
2. Drawer chooses a word from 3 options
3. Drawer draws on canvas
4. Other players guess via chat
5. Points are awarded for correct guesses
6. Next player becomes the drawer

---

## 2. MVP Scope

### Must Have Features:
- Room creation & joining
- Player list
- Turn-based drawing
- Real-time canvas sync
- Chat system
- Word guessing logic
- Score tracking
- Round system

### Not Required (for MVP):
- Avatars
- Custom word lists
- Mobile optimization
- Advanced moderation
- Replays

---

## 3. System Architecture

### High-Level Components:
```
Client (Frontend)
   |
   | WebSocket (real-time)
   v
Server (Backend)
   |
   ├── Game State Manager
   ├── Room Manager
   ├── Chat Handler
   └── Score Engine
```

---

## 4. Tech Stack (MVP Optimized)

### Frontend:
- React (or plain JS for simplicity)
- HTML5 Canvas (drawing)
- Socket.IO client

### Backend:
- Node.js + Express
- Socket.IO (WebSockets)

### Optional:
- Redis (for scaling rooms later)

---

## 5. Core Modules

### 5.1 Room Manager
- Create room (roomId)
- Join/leave players
- Maintain player list

### 5.2 Game State Manager
- Current round
- Current drawer
- Current word
- Timer

### 5.3 Drawing Engine
- Capture mouse events
- Emit strokes:
  ```
  {
    x, y,
    color,
    size
  }
  ```
- Broadcast to all clients

### 5.4 Chat System
- Receive messages
- Broadcast to room
- Check correctness:
  ```
  if (message === word) → correct guess
  ```

### 5.5 Scoring System
- Points for correct guess
- Bonus for faster answers
- Drawer gets points too

---

## 6. Real-Time Flow

### Drawing Flow:
1. Drawer moves mouse
2. Frontend emits `draw` event
3. Server receives and broadcasts
4. All clients render stroke

### Guess Flow:
1. Player sends chat message
2. Server checks against word
3. If correct:
   - Update score
   - Notify all players

---

## 7. Database (Optional for MVP)

You can skip DB initially and use in-memory storage:

```
rooms = {
  roomId: {
    players: [],
    scores: {},
    word: "",
    drawer: playerId
  }
}
```

---

## 8. Scaling Strategy (Future)

- Use Redis for shared state
- Load balance WebSocket servers
- Persist scores in DB

---

## 9. Minimal API / Events

### WebSocket Events:

#### Client → Server:
- `join_room`
- `start_game`
- `draw`
- `send_message`

#### Server → Client:
- `room_joined`
- `game_started`
- `draw_update`
- `chat_message`
- `correct_guess`
- `score_update`

---

## 10. MVP Build Plan (Execution Order)

1. Setup Node + Socket.IO server
2. Implement room creation/join
3. Add canvas drawing + sync
4. Add chat system
5. Add word selection logic
6. Add scoring
7. Add turn rotation

---

## 11. Final MVP Definition

A working MVP is achieved when:
- Multiple players can join a room
- One player draws
- Others see drawing in real-time
- Players can guess via chat
- Scores update correctly
- Turns rotate automatically