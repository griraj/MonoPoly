# Monopoly Online — MVP

A real-time multiplayer Monopoly game for 2–6 players. Node.js + Socket.IO backend
(in-memory game state, authoritative server, full rules engine), React + Vite +
Tailwind frontend.

This is the **MVP tier** described in our conversation: no database, no accounts —
just a lobby code, real-time play, and a server that enforces every rule. It's a
complete, playable game you can run locally or deploy today. Persistence, real
auth, Docker, and CI are the natural next layer (see "What's not in here yet" below).

## Quick start

You need two terminals.

**1. Start the server**
```bash
cd server
npm install
npm start          # listens on http://localhost:4000
```

**2. Start the client**
```bash
cd client
npm install
npm run dev         # opens http://localhost:5173
```

Open `http://localhost:5173` in a few different browser windows (or send the invite
link to friends once you deploy it — see below), create a lobby, share the 5-letter
code, and play.

### Configuration

- `server/index.js` reads `PORT` (default 4000) and `CLIENT_ORIGIN` (default `*`,
  set this to your deployed frontend URL in production for CORS).
- `client/.env` sets `VITE_SERVER_URL` — point it at wherever you deploy the server.

## How it's built

```
server/
  Game.js          — the rules engine: dice, movement, rent, auctions, building,
                      mortgages, jail, trading, bankruptcy, win detection
  board.js          — official 40-space board data (prices, rents, mortgage values)
  cards.js          — full Chance + Community Chest decks
  LobbyManager.js    — tracks all in-memory games, lobby codes, reconnection
  index.js           — Express + Socket.IO server, wires every socket event to the
                      Game engine and broadcasts state to the room
  smoketest.js        — scripted 2-player integration test (npm run test:smoke)

client/
  src/lib/store.js    — Zustand store: session, game state, chat, self/isHost/isMyTurn
  src/lib/socket.js    — Socket.IO client + promise-based emitAck() helper
  src/components/      — Home, LobbyRoom, GameScreen, Board, Space, PlayerDock,
                        DiceTray, ActionBar, PropertyModal, AuctionPanel, TradeModal,
                        ChatPanel, WinnerBanner
```

**The server is authoritative.** Every action (rolling, buying, building, trading)
is validated in `Game.js` against the current state; the client never computes
game outcomes itself, it just renders whatever state the server broadcasts. This
is what prevents cheating and desync.

**State sync model:** every mutating socket event triggers `game:state` being
broadcast to the whole lobby room. Clients don't do optimistic updates — they wait
for the authoritative broadcast, which keeps everyone's board perfectly in sync
with zero manual reconciliation logic.

### Rules implemented
Buying & auctions (turn-based bidding), rent (with color-group monopoly bonus,
railroad count-based rent, utility dice-multiplier rent), building houses/hotels
with the even-build rule, selling houses, mortgage/unmortgage, all Chance &
Community Chest cards, jail (pay/roll/card), 3-doubles-to-jail, passing GO,
trading (money + properties + Get Out of Jail cards), bankruptcy with automatic
liquidation and asset transfer to creditor or bank, and win detection.

### Tested

`server/smoketest.js` spins up the real server and drives two socket.io clients
through hundreds of simulated turns (rolling, buying, paying rent, auctions,
taxes, turn order) to catch state-machine bugs. Run it with:
```bash
cd server && npm install && npm run test:smoke
```

## Deploying so friends can actually connect

This sandbox can't expose a public URL, so to let people on other networks play
you'll need to deploy it yourself. The simplest path:

1. Deploy `server/` to any Node host (Render, Railway, Fly.io, a VPS). Set
   `CLIENT_ORIGIN` to your frontend's URL.
2. Deploy `client/` (it's a static build — `npm run build` outputs `dist/`) to
   Vercel/Netlify/Cloudflare Pages/any static host. Set `VITE_SERVER_URL` to your
   server's URL.
3. Socket.IO needs a host that supports persistent WebSocket connections (most of
   the above do; classic serverless functions generally don't).

## What's not in here yet

This MVP intentionally skips the heavier infrastructure from the original spec so
it could be built and *actually tested end-to-end* in one pass:

- **Accounts/auth (JWT/OAuth)** — currently just a name + lobby code. Straightforward
  to add: an `auth` table, JWT middleware on socket handshake, and swapping
  `socket.id` for a stable `userId` as the player key.
- **Database (Postgres/Prisma)** — state is in-memory and lost on server restart.
  Next step: persist `Game` snapshots (the `toJSON()` output is already a clean
  serialization boundary) to Postgres on every mutation or on an interval.
- **Docker/CI/CD** — no Dockerfiles yet; both apps are plain Node/Vite so
  containerizing is mechanical once you're ready.
- **Spectator mode, sound effects, stats dashboards, dark/light theme toggle** —
  not wired up.
- **Countdown-timer auctions** — auctions are turn-based (each player bids or
  passes in order) rather than a live countdown clock, which is simpler to keep
  correct without a server-side timer service. Worth revisiting once this is
  hosted somewhere with reliable scheduled tasks.
- **Load/stress testing** — meaningless until this is deployed on real
  infrastructure; the in-memory design will comfortably handle many concurrent
  lobbies on a single small server, but "thousands simultaneously" needs
  horizontal scaling (Redis-backed Socket.IO adapter) that isn't built yet.

Happy to build out any of these next — just say which one.
