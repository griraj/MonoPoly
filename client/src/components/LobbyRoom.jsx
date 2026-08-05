import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { socket, emitAck } from '../lib/socket.js';
import { PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

export default function LobbyRoom() {
  const { game, isHost, session, setError, leaveSession } = useStore();
  const [copied, setCopied] = useState(false);
  const me = game.players.find((p) => p.id === session.playerId);

  async function copyInvite() {
    const url = `${window.location.origin}${window.location.pathname}?code=${game.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function toggleReady() {
    await emitAck('lobby:setReady', { ready: !me.ready }).catch((e) => setError(e.message));
  }

  async function startGame() {
    try {
      await emitAck('lobby:start', {});
    } catch (e) {
      setError(e.message);
    }
  }

  async function kick(targetId) {
    await emitAck('lobby:kick', { targetId }).catch((e) => setError(e.message));
  }

  async function transferHost(targetId) {
    await emitAck('lobby:transferHost', { targetId }).catch((e) => setError(e.message));
  }

  const allReady = game.players.length >= 3 && game.players.every((p) => p.id === game.hostId || p.ready);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-xs uppercase tracking-[0.3em] text-gold-400 mb-1">Lobby</div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-display text-4xl font-semibold text-parchment-50 tracking-widest font-mono-num">
              {game.code}
            </h1>
            <button
              onClick={copyInvite}
              className="text-xs px-2.5 py-1 rounded-md bg-felt-800 border border-gold-600/30 text-gold-400 hover:bg-felt-700 transition"
            >
              {copied ? 'Copied!' : 'Copy invite'}
            </button>
          </div>
          <p className="text-parchment-100/90 text-sm mt-2">
            {game.players.length} / 6 players &middot; waiting for host to start
          </p>
        </div>

        <div className="bg-felt-800/70 border border-gold-600/25 rounded-2xl p-5 shadow-2xl space-y-2">
          {game.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-felt-950/40 rounded-lg px-3.5 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                  style={{ background: PLAYER_COLOR_HEX[p.color] }}
                />
                <span className="text-parchment-100 font-medium">{p.name}</span>
                {p.id === game.hostId && (
                  <span className="text-[10px] uppercase tracking-wider bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded">
                    Host
                  </span>
                )}
                {!p.connected && (
                  <span className="text-[10px] uppercase tracking-wider bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                    offline
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {p.id !== game.hostId && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      p.ready ? 'text-felt-950 bg-gold-500' : 'text-parchment-200/85 bg-felt-700'
                    }`}
                  >
                    {p.ready ? 'Ready' : 'Not ready'}
                  </span>
                )}
                {isHost() && p.id !== session.playerId && (
                  <>
                    <button
                      onClick={() => transferHost(p.id)}
                      title="Make host"
                      className="text-xs text-parchment-200/85 hover:text-gold-400 transition"
                    >
                      ⇧
                    </button>
                    <button
                      onClick={() => kick(p.id)}
                      title="Kick"
                      className="text-xs text-parchment-200/85 hover:text-red-400 transition"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={leaveSession}
            className="flex-1 py-2.5 rounded-lg bg-felt-800 border border-gold-600/25 text-parchment-200 hover:bg-felt-700 transition text-sm font-medium"
          >
            Leave
          </button>
          {!isHost() && (
            <button
              onClick={toggleReady}
              className={`flex-1 py-2.5 rounded-lg font-bold transition ${
                me?.ready ? 'bg-felt-700 text-parchment-200' : 'bg-gold-500 hover:bg-gold-400 text-ink-900'
              }`}
            >
              {me?.ready ? 'Not Ready' : "I'm Ready"}
            </button>
          )}
          {isHost() && (
            <button
              onClick={startGame}
              disabled={game.players.length < 3}
              className="flex-1 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-ink-900 font-bold transition"
            >
              Start Game {allReady ? '' : '(players still readying up)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
