import { customAlphabet } from 'nanoid';
import { Game } from './Game.js';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

export class LobbyManager {
  constructor() {
    this.games = new Map(); // code -> Game
    this.socketToGame = new Map(); // socketId -> code
  }

  createGame(hostSocketId, hostName, settings) {
    let code;
    do {
      code = nanoid();
    } while (this.games.has(code));
    const game = new Game(code, hostSocketId, hostName, settings);
    this.games.set(code, game);
    this.socketToGame.set(hostSocketId, code);
    return game;
  }

  joinGame(code, socketId, name) {
    const game = this.games.get(code.toUpperCase());
    if (!game) throw new Error('Lobby not found');
    if (game.status !== 'lobby') {
      // allow rejoin if already a player (reconnect case handled separately)
      throw new Error('Game already in progress');
    }
    game.addPlayer(socketId, name);
    this.socketToGame.set(socketId, game.code);
    return game;
  }

  getGameForSocket(socketId) {
    const code = this.socketToGame.get(socketId);
    if (!code) return null;
    return this.games.get(code) || null;
  }

  getGame(code) {
    return this.games.get((code || '').toUpperCase()) || null;
  }

  leaveGame(socketId) {
    const game = this.getGameForSocket(socketId);
    if (!game) return null;
    game.removePlayer(socketId);
    this.socketToGame.delete(socketId);
    if (game.players.length === 0) {
      this.games.delete(game.code);
    }
    return game;
  }

  cleanupEmpty() {
    for (const [code, game] of this.games) {
      const allDisconnected = game.players.every((p) => !p.connected);
      const stale = game.log.length && Date.now() - (game.log[game.log.length - 1].ts || 0) > 1000 * 60 * 60 * 6;
      if (game.players.length === 0 || (allDisconnected && stale)) {
        this.games.delete(code);
      }
    }
  }
}
