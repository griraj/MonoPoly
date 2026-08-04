import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { LobbyManager } from './LobbyManager.js';

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

const lobbies = new LobbyManager();

function broadcast(game) {
  io.to(game.code).emit('game:state', game.toJSON());
}

function wrap(socket, game, fn, cb) {
  try {
    const result = fn();
    if (game) broadcast(game);
    cb && cb({ ok: true, result });
  } catch (err) {
    socket.emit('game:error', { message: err.message });
    cb && cb({ ok: false, error: err.message });
  }
}

io.on('connection', (socket) => {
  socket.on('lobby:create', ({ name, settings }, cb) => {
    try {
      const playerName = (name || 'Player').slice(0, 20);
      const game = lobbies.createGame(socket.id, playerName, settings || {});
      socket.join(game.code);
      cb && cb({ ok: true, code: game.code, state: game.toJSON() });
      broadcast(game);
    } catch (err) {
      cb && cb({ ok: false, error: err.message });
    }
  });

  socket.on('lobby:join', ({ code, name }, cb) => {
    try {
      const playerName = (name || 'Player').slice(0, 20);
      const game = lobbies.joinGame(code, socket.id, playerName);
      socket.join(game.code);
      cb && cb({ ok: true, code: game.code, state: game.toJSON() });
      broadcast(game);
    } catch (err) {
      cb && cb({ ok: false, error: err.message });
    }
  });

  socket.on('lobby:rejoin', ({ code, playerId }, cb) => {
    const game = lobbies.getGame(code);
    if (!game) return cb && cb({ ok: false, error: 'Lobby not found' });
    const player = game.players.find((p) => p.id === playerId);
    if (!player) return cb && cb({ ok: false, error: 'Player not found in this game' });
    // Re-key the player's socket id to the new connection.
    player.id = socket.id;
    game.properties && Object.values(game.properties).forEach((ps) => {
      if (ps.owner === playerId) ps.owner = socket.id;
    });
    if (game.hostId === playerId) game.hostId = socket.id;
    if (game.turnIndex !== undefined && game.players[game.turnIndex]) {
      // turnIndex is positional, unaffected
    }
    game.reconnectPlayer(socket.id);
    lobbies.socketToGame.set(socket.id, game.code);
    socket.join(game.code);
    cb && cb({ ok: true, code: game.code, state: game.toJSON() });
    broadcast(game);
  });

  socket.on('lobby:setReady', ({ ready } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => {
      const p = game.getPlayer(socket.id);
      if (p) p.ready = !!ready;
    }, cb);
  });

  socket.on('lobby:kick', ({ targetId } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => {
      if (game.hostId !== socket.id) throw new Error('Only the host can kick players');
      if (game.status !== 'lobby') throw new Error('Cannot kick after game has started');
      game.players = game.players.filter((p) => p.id !== targetId);
      io.sockets.sockets.get(targetId)?.leave(game.code);
      lobbies.socketToGame.delete(targetId);
    }, cb);
  });

  socket.on('lobby:transferHost', ({ targetId } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => {
      if (game.hostId !== socket.id) throw new Error('Only the host can transfer host');
      if (!game.getPlayer(targetId)) throw new Error('Player not found');
      game.hostId = targetId;
    }, cb);
  });

  socket.on('lobby:start', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => {
      if (game.hostId !== socket.id) throw new Error('Only the host can start the game');
      game.startGame();
    }, cb);
  });

  socket.on('game:rollDice', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.rollDice(socket.id), cb);
  });

  socket.on('game:buyProperty', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.buyProperty(socket.id), cb);
  });

  socket.on('game:declineProperty', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.declineProperty(socket.id), cb);
  });

  socket.on('game:auctionBid', ({ amount } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.auctionBid(socket.id, amount), cb);
  });

  socket.on('game:auctionPass', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.auctionPass(socket.id), cb);
  });

  socket.on('game:buildHouse', ({ spaceId } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.buildHouse(socket.id, spaceId), cb);
  });

  socket.on('game:sellHouse', ({ spaceId } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.sellHouse(socket.id, spaceId), cb);
  });

  socket.on('game:mortgage', ({ spaceId } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.mortgageProperty(socket.id, spaceId), cb);
  });

  socket.on('game:unmortgage', ({ spaceId } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.unmortgageProperty(socket.id, spaceId), cb);
  });

  socket.on('game:payJailFine', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.payJailFine(socket.id), cb);
  });

  socket.on('game:useJailCard', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.useJailCard(socket.id), cb);
  });

  socket.on('game:endTurn', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.endTurn(socket.id), cb);
  });

  socket.on('trade:propose', (offerPayload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => {
      const { toId, ...offer } = offerPayload;
      game.proposeTrade(socket.id, toId, offer);
    }, cb);
  });

  socket.on('trade:respond', ({ tradeId, accept } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.respondTrade(tradeId, socket.id, accept), cb);
  });

  socket.on('trade:cancel', ({ tradeId } = {}, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => game.cancelTrade(tradeId, socket.id), cb);
  });

  socket.on('chat:send', ({ text }) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game || !text) return;
    const player = game.getPlayer(socket.id);
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      playerId: socket.id,
      name: player ? player.name : 'Unknown',
      color: player ? player.color : null,
      text: String(text).slice(0, 500),
      ts: Date.now(),
    };
    io.to(game.code).emit('chat:message', msg);
  });

  socket.on('host:pauseGame', (payload, cb) => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    wrap(socket, game, () => {
      if (game.hostId !== socket.id) throw new Error('Only the host can pause');
      game.status = game.status === 'paused' ? 'playing' : 'paused';
    }, cb);
  });

  socket.on('disconnect', () => {
    const game = lobbies.getGameForSocket(socket.id);
    if (!game) return;
    if (game.status === 'lobby') {
      const result = lobbies.leaveGame(socket.id);
      if (result) broadcast(result);
    } else {
      game.removePlayer(socket.id);
      broadcast(game);
      // keep mapping so a rejoin with the old id concept still finds nothing;
      // client stores {code, playerId} and calls lobby:rejoin which re-keys id.
      lobbies.socketToGame.delete(socket.id);
    }
  });
});

setInterval(() => lobbies.cleanupEmpty(), 1000 * 60 * 30);

server.listen(PORT, () => {
  console.log(`Monopoly server listening on port ${PORT}`);
});
