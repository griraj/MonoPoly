import { useState } from 'react';
import { useStore } from '../lib/store.js';

export default function Home() {
  const { createLobby, joinLobby, setError } = useStore();
  const [mode, setMode] = useState('create'); // create | join
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [freeParkingBonus, setFreeParkingBonus] = useState(true);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter a name first.');
    setBusy(true);
    try {
      if (mode === 'create') {
        await createLobby(name.trim(), { freeParkingBonus, maxPlayers });
      } else {
        if (!code.trim()) return setError('Enter a lobby code.');
        await joinLobby(code.trim().toUpperCase(), name.trim());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-gold-400 text-xs tracking-[0.3em] uppercase mb-2">
            <span className="w-8 h-px bg-gold-600" /> Online Edition <span className="w-8 h-px bg-gold-600" />
          </div>
          <h1 className="font-display text-5xl font-semibold text-parchment-50 tracking-tight">
            Monopoly
          </h1>
          <p className="text-parchment-300/70 text-sm mt-2">Real-time multiplayer, 3–6 players.</p>
        </div>

        <div className="bg-felt-800/70 border border-gold-600/25 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex gap-1 mb-6 bg-felt-950/60 rounded-lg p-1">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                mode === 'create' ? 'bg-gold-500 text-ink-900' : 'text-parchment-300 hover:text-parchment-100'
              }`}
            >
              Create Lobby
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                mode === 'join' ? 'bg-gold-500 text-ink-900' : 'text-parchment-300 hover:text-parchment-100'
              }`}
            >
              Join Lobby
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-parchment-300/60 mb-1.5">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="e.g. Riley"
                className="w-full bg-felt-950/60 border border-gold-600/25 rounded-lg px-3.5 py-2.5 text-parchment-50 placeholder-parchment-300/30 outline-none focus:border-gold-500 transition"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-parchment-300/60 mb-1.5">
                  Lobby code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="e.g. 9VTBY"
                  className="w-full bg-felt-950/60 border border-gold-600/25 rounded-lg px-3.5 py-2.5 text-parchment-50 placeholder-parchment-300/30 outline-none focus:border-gold-500 tracking-widest font-mono-num transition"
                />
              </div>
            )}

            {mode === 'create' && (
              <div className="flex items-center justify-between bg-felt-950/40 rounded-lg px-3.5 py-2.5">
                <span className="text-sm text-parchment-200">Bonus cash on Free Parking</span>
                <button
                  type="button"
                  onClick={() => setFreeParkingBonus((v) => !v)}
                  className={`w-10 h-5.5 rounded-full transition relative ${
                    freeParkingBonus ? 'bg-gold-500' : 'bg-felt-700'
                  }`}
                  style={{ height: '22px' }}
                >
                  <span
                    className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-parchment-50 transition-transform ${
                      freeParkingBonus ? 'translate-x-[19px]' : 'translate-x-0.5'
                    }`}
                    style={{ width: '18px', height: '18px' }}
                  />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-ink-900 font-bold tracking-wide transition"
            >
              {busy ? 'Please wait…' : mode === 'create' ? 'Create Lobby' : 'Join Lobby'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
