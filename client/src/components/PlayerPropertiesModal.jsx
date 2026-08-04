import { COLOR_HEX, PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

export default function PlayerPropertiesModal({ game, player, onClose }) {
  const ownedSpaces = player.properties
    .map((spaceId) => game.board.find((space) => space.id === spaceId))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-parchment-50 rounded-3xl overflow-hidden shadow-2xl text-ink-900"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-900/10">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-white/30 text-lg"
              style={{ background: PLAYER_COLOR_HEX[player.color], color: '#111' }}
            >
              ♟
            </span>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{player.name}</h2>
              <p className="text-xs text-ink-700/80">Player properties and status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-900/50 hover:text-ink-900 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm text-ink-700">
            <Info label="Money" value={`$${player.money.toLocaleString()}`} />
            <Info label="Position" value={game.board.find((space) => space.id === player.position)?.name || player.position} />
            <Info label="Properties" value={ownedSpaces.length} />
            <Info
              label="Status"
              value={player.bankrupt ? 'Bankrupt' : player.inJail ? 'In Jail' : 'Active'}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Owned properties</h3>
            {ownedSpaces.length === 0 ? (
              <p className="text-sm text-ink-700">This player does not own any properties yet.</p>
            ) : (
              <div className="space-y-2">
                {ownedSpaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-ink-900/10 bg-white/80 px-3 py-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {space.type === 'property' ? (
                        <span
                          className="w-2.5 h-8 rounded-sm"
                          style={{ background: COLOR_HEX[space.color] }}
                        />
                      ) : (
                        <span className="text-lg">{space.type === 'railroad' ? '🚂' : space.type === 'utility' ? '💡' : '🔹'}</span>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-900 truncate">{space.name}</div>
                        <div className="text-[11px] text-ink-700/80 truncate">
                          {space.type === 'property' ? `$${space.price}` : space.type === 'railroad' ? 'Railroad' : 'Utility'}
                        </div>
                      </div>
                    </div>
                    {space.type === 'property' && (
                      <span className="text-[11px] text-ink-700/80">{game.properties[space.id].houses} houses</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-ink-900/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.15em] text-ink-700/60">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink-900">{value}</div>
    </div>
  );
}
