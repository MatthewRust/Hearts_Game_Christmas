# AI Agent Instructions – Hearts Game Codebase

## Big Picture
- **Architecture:** Two services – a Node/Express + Socket.IO backend and a Vite React frontend. See [docker-compose.yml](../docker-compose.yml), [backend](../backend), and [frontend](../frontend).
- **Realtime over WebSockets:** Frontend and backend communicate via Socket.IO events (no REST beyond `/` healthcheck). Core events are defined/handled in [backend/HeartsGame/server.js](../backend/HeartsGame/server.js).
- **Game engine on server:** Hearts rules, dealing, trick resolution, scoring, and turn order live in [backend/HeartsGame/heartGame.js](../backend/HeartsGame/heartGame.js) using supporting classes in [backend/cardProps](../backend/cardProps) and [backend/HeartsGame/Pile.js](../backend/HeartsGame/Pile.js).
- **State flow:** Server is source of truth. It emits per-player hands (`game:hand`) privately and shared state (`game:state`, `game:trickResolved`, `game:over`) to all clients. UI reacts to these events.

## Key Conventions
- **ES Modules everywhere:** Both apps use `type: "module"`. Default exports are common (e.g., `export default HeartGame`).
- **Data shapes:** Cards are `{ suit, rank, value }`. Some server-side objects may be class instances, but `Card#toJSON()` ensures clean serialization. Frontend normalizes via `normalizeCard()` in [frontend/src/utils/cardImage.js](../frontend/src/utils/cardImage.js).
- **Scoring (customized):** Hearts carry tiered points (2–10 = 1, J=2, Q=3, K=4, A=5). Queen of Spades = 13. See [backend/cardProps/Deck.js](../backend/cardProps/Deck.js).
- **Hearts rules:** Must follow suit if possible; hearts can’t be led until broken (unless hand is all hearts). See [backend/HeartsGame/Pile.js](../backend/HeartsGame/Pile.js) and [backend/HeartsGame/heartGame.js](../backend/HeartsGame/heartGame.js).
- **Host assignment:** First connected player is marked `isHost`; UI gates the Start button to host in [frontend/src/WaitingRoom.jsx](../frontend/src/WaitingRoom.jsx). Server currently allows any client to emit `game:start` – host-only enforcement is UI-level.
- **Player identity:** Turn ownership uses the player’s `name` string, not socket id. Avoid duplicate names; there’s no server-side uniqueness check.
- **Asset quirk:** Diamonds folder is spelled `Daimonds` in the repo; mapping handled in [frontend/src/utils/cardImage.js](../frontend/src/utils/cardImage.js).

## Backend
- **Entry:** [backend/HeartsGame/server.js](../backend/HeartsGame/server.js) starts Express + Socket.IO on `3001`.
- **Core events:**
  - `join` → registers `{ id, name }`, recalculates host, emits `players:update`, `join:success` (to caller).
  - `game:start` → validates player count, creates `HeartGame`, deals, emits each `game:hand`, then `game:state` and `game:started`.
  - `game:playCard` → validates turn and legality, updates hands, emits `game:hand` (per player), `game:state`, and when trick completes `game:trickResolved`; when round ends `game:over`.
  - `game:end` → resets game, emits `game:ended`.
  - Disconnects emit `players:update` and `player:left`.
- **Game engine:** `HeartGame` manages deck creation, dealing with card removals for uneven splits, trick resolution, hearts break, shoot-the-moon, standings, and leader selection by 2♣ holder. See [backend/HeartsGame/heartGame.js](../backend/HeartsGame/heartGame.js).
- **Persistence:** SQLite table is created but not used beyond initialization; all runtime state is in-memory (`connectedPlayers`, `heartGame`).

## Frontend
- **Bootstrap:** Vite React app; entry is [frontend/src/main.jsx](../frontend/src/main.jsx) loading [frontend/src/App.jsx](../frontend/src/App.jsx).
- **Sockets:** Single `socket` instance in `App.jsx` connects to `http://localhost:3001`. Adjust if deploying behind different hosts/ports.
- **Views:**
  - Waiting room: [frontend/src/WaitingRoom.jsx](../frontend/src/WaitingRoom.jsx) shows players and Start (host-only UI).
  - Game screen: [frontend/src/GameScreen.jsx](../frontend/src/GameScreen.jsx) renders pile, scores, and your hand; clicking a card emits `game:playCard` with `{ playerName, card }`.
- **Images:** `cardImageUrl()` builds paths to per-suit images. Uses the `Daimonds` mapping as a project-specific fix.

## Developer Workflows
- **Local (no Docker):**
  - Backend
    - Install: `cd backend && npm install`
    - Run: `npm start` (port 3001)
  - Frontend
    - Install: `cd ../frontend && npm install`
    - Run: `npm run dev` (Vite on 5173; use `--host` if accessed remotely)
- **Docker:** `docker compose up --build` brings up both services; frontend forwarded to `5174`, backend to `3001`.
- **Linting:** `cd frontend && npm run lint`. No tests are configured.

## Tips for Contributors/Agents
- **Add events end-to-end:** Define backend handler in `server.js`, update game engine if needed, emit minimal state deltas, and wire a corresponding `socket.on(...)` in `App.jsx`/relevant view.
- **Preserve data shapes:** Keep card objects `{ suit, rank, value }`. When adding fields, ensure they survive `toJSON()`.
- **Guard name collisions:** If adding features depending on `playerName`, consider server-side uniqueness checks.
- **Production build:** Current Dockerfiles run dev servers. For prod, add a frontend build + static hosting and a backend `NODE_ENV=production` pathway.