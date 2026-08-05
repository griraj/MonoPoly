import { useStore } from '../lib/store.js';

export default function WinnerBanner({ game }) {
  const { leaveSession } = useStore();
  const winner = game.players.find((p) => p.id === game.winner);
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-felt-800 border-2 border-gold-500 rounded-2xl p-8 text-center shadow-2xl">
        <div className="text-xs uppercase tracking-[0.3em] text-gold-400 mb-2">Game Over</div>
        <h2 className="font-display text-4xl font-bold text-parchment-50 mb-4">
          {winner?.name} wins! 🏆
        </h2>
        <div className="space-y-1.5 mb-6">
          {[...game.players]
            .sort((a, b) => b.money - a.money)
            .map((p) => (
              <div key={p.id} className="flex justify-between text-sm text-parchment-200 px-2">
                <span>{p.name}</span>
                <span className="font-mono-num text-gold-400">
                  Rs {p.money} · {p.properties.length} properties
                </span>
              </div>
            ))}
        </div>
        <button
          onClick={leaveSession}
          className="w-full py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-900 font-bold transition"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
