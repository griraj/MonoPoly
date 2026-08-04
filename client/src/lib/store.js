import { create } from 'zustand';
import { socket, emitAck } from './socket.js';

const SESSION_KEY = 'monopoly_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export const useStore = create((set, get) => ({
  connected: false,
  selfId: null, // current socket id, mirrors game.players[].id for "you"
  session: loadSession(), // { code, playerId, name }
  game: null,
  chat: [],
  error: null,
  toast: null,

  setError(message) {
    set({ error: message });
    if (message) setTimeout(() => set((s) => (s.error === message ? { error: null } : {})), 4500);
  },

  setToast(message) {
    set({ toast: message });
    if (message) setTimeout(() => set((s) => (s.toast === message ? { toast: null } : {})), 3200);
  },

  async createLobby(name, settings) {
    const res = await emitAck('lobby:create', { name, settings });
    const session = { code: res.code, playerId: socket.id, name };
    saveSession(session);
    set({ session, game: res.state });
    return res;
  },

  async joinLobby(code, name) {
    const res = await emitAck('lobby:join', { code, name });
    const session = { code: res.code, playerId: socket.id, name };
    saveSession(session);
    set({ session, game: res.state });
    return res;
  },

  async tryRejoin() {
    const session = get().session;
    if (!session) return false;
    try {
      const res = await emitAck('lobby:rejoin', { code: session.code, playerId: session.playerId });
      const newSession = { ...session, playerId: socket.id };
      saveSession(newSession);
      set({ session: newSession, game: res.state });
      return true;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      set({ session: null });
      return false;
    }
  },

  leaveSession() {
    localStorage.removeItem(SESSION_KEY);
    set({ session: null, game: null, chat: [] });
  },

  self() {
    const { game, session } = get();
    if (!game || !session) return null;
    return game.players.find((p) => p.id === session.playerId) || null;
  },

  isHost() {
    const { game, session } = get();
    return !!(game && session && game.hostId === session.playerId);
  },

  isMyTurn() {
    const { game, session } = get();
    if (!game || game.status !== 'playing') return false;
    return game.players[game.turnIndex]?.id === session?.playerId;
  },
}));

socket.on('connect', () => useStore.setState({ connected: true, selfId: socket.id }));
socket.on('disconnect', () => useStore.setState({ connected: false }));
socket.on('game:state', (state) => useStore.setState({ game: state }));
socket.on('game:error', (e) => useStore.getState().setError(e.message));
socket.on('chat:message', (msg) => useStore.setState((s) => ({ chat: [...s.chat, msg].slice(-200) })));
