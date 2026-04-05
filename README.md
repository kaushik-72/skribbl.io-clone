# 🎨 Skribbl Clone

A real-time multiplayer drawing and guessing game built as a full-stack web application.

🔗 **Live Demo:** https://skribbl-io-clone.vercel.app/

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Canvas | HTML5 Canvas API |
| Backend | Node.js + Express |
| Real-time | Socket.IO |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features

- 🏠 Create or join rooms via room code
- 🎮 Turn-based drawing — one drawer per round
- 🖌️ Real-time canvas sync across all players
- 💬 Live chat and guess system
- 🏆 Scoring and leaderboard
- ⏱️ Countdown timer with progressive hints
- ⚡ Game modes: Quick / Battle / Championship / Custom
- 📱 Touch support for mobile drawing

---

## Run Locally

### Prerequisites
- Node.js v18+
- npm

### Backend

\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

Server runs on http://localhost:3001

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

App runs on http://localhost:5173

---

## Architecture

\`\`\`
Browser (React)  ←→  Socket.IO  ←→  Node.js Server
     ↓                                     ↓
HTML5 Canvas                        In-memory Map
(drawing)                           (rooms, players,
                                     game state)
\`\`\`

### WebSocket Event Flow

1. Player creates room → server generates room ID → player joins lobby
2. Second player joins with room code → both see live player list
3. Host starts game → server picks first drawer → sends word options
4. Drawer picks word → server starts timer → hint sent to guessers
5. Drawer draws → strokes emitted as normalized (x,y) coords → synced to all viewers
6. Guesser types → server checks match → awards points → updates leaderboard
7. Timer ends or all guessed → round ends → next drawer → repeat

---

## Project Structure

\`\`\`
skribbl-clone/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx      # Create/join room + game mode selector
│       │   ├── Lobby.jsx     # Waiting room with player list
│       │   └── Game.jsx      # Main game screen
│       └── components/
│           ├── Canvas.jsx    # Drawing surface + tools
│           ├── Timer.jsx     # Countdown with color feedback
│           ├── PlayerList.jsx
│           ├── GuessInput.jsx
│           ├── WordSelection.jsx
│           └── RoundEnd.jsx
└── backend/
    ├── index.js              # Express + Socket.IO + all game logic
    └── words.js              # Word list + random picker
\`\`\`

---

## Deployment

- **Frontend**: Vercel — auto-deploys on push to main
- **Backend**: Render — WebSocket support, Node.js runtime
- **Environment Variable**: `VITE_SERVER_URL` set to Render backend URL