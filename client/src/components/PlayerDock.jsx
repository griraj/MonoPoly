import { PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

export default function PlayerDock({ game, selfId, onSelectPlayer }) {
  return (
    <div className="space-y-2">
      {game.players.map((p, idx) => {
        const isTurn = idx === game.turnIndex && game.status === 'playing';
        return (
          <button
            key={p.id}
            onClick={() => onSelectPlayer?.(p.id)}
            className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 border transition text-left ${
              p.bankrupt
                ? 'bg-felt-950/40 border-felt-700/40 opacity-40'
                : isTurn
                ? 'bg-felt-800 border-gold-500/60 animate-pulse-glow'
                : 'bg-felt-800/60 border-gold-600/15'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full ring-2 ring-white/10 shrink-0"
                style={{ background: PLAYER_COLOR_HEX[p.color] }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-parchment-100 truncate">
                    {p.name}
                    {p.id === selfId ? ' (you)' : ''}
                  </span>
                  {!p.connected && <span className="text-[9px] text-red-300/80">off</span>}
                </div>
                <div className="text-[10px] text-parchment-300/50 flex gap-1.5">
                  {p.inJail && <span className="text-amber-400/80">In jail</span>}
                  {p.bankrupt && <span>Bankrupt</span>}
                  {!p.bankrupt && <span>{p.properties.length} properties</span>}
                  {p.getOutOfJailCards > 0 && <span>· {p.getOutOfJailCards} jail card</span>}
                </div>
              </div>
            </div>
            <span className="font-mono-num text-sm font-bold text-gold-400 shrink-0 ml-2">
              ${p.money.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
