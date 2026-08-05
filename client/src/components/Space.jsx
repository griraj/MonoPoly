import { COLOR_HEX, PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

const TRANSPORT_ICONS = {
  'Pakistan Railways': '🚂',
  'Daewoo Express': '🚌',
  'PIA Airways': '✈️',
  'Faisal Movers': '🚌',
};

const UTILITY_ICONS = {
  'WAPDA Electric Board': '💡',
  'Sui Gas Company': '🔥',
};

const BAND_CLASSES = {
  top: 'h-[26%] w-full border-b-2',
  bottom: 'h-[26%] w-full border-t-2 order-last',
  left: 'w-[26%] h-full border-r-2',
  right: 'w-[26%] h-full border-l-2 order-last',
};

export default function Space({ space, propState, players, onClick, isCorner, edge }) {
  const owner = propState?.owner ? players.find((p) => p.id === propState.owner) : null;
  const occupants = players.filter((p) => !p.bankrupt && p.position === space.id);
  const isProperty = space.type === 'property';
  const isSideColumn = edge === 'left' || edge === 'right';
  const isRow = edge === 'top' || edge === 'bottom';

  return (
    <button
      onClick={onClick}
      className={`relative flex bg-parchment-100 border border-ink-900/70 overflow-hidden text-left hover:brightness-[1.03] transition ${
        isCorner ? 'items-center justify-center text-center p-1' : isRow ? 'flex-col p-0.5' : 'flex-row p-0.5'
      }`}
      style={{ minWidth: 0, minHeight: 0 }}
    >
      {isProperty && (
        <div
          className={`shrink-0 border-ink-900/70 ${BAND_CLASSES[edge]}`}
          style={{ background: COLOR_HEX[space.color] }}
        />
      )}
      {propState?.mortgaged && (
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-20">
          <span className="text-[7px] text-white font-bold tracking-wider rotate-[-20deg]">MORTGAGED</span>
        </div>
      )}

      {/* corner tiles: GO / Jail / Free Parking / Go To Jail get their own layout */}
      {isCorner && space.type === 'go' && (
        <div className="absolute inset-0.5 flex items-center justify-center bg-[var(--color-mono-red)] rotate-[-32deg] rounded-sm">
          <span className="rotate-[32deg] font-display font-black text-white text-[13px] tracking-tight">GO</span>
        </div>
      )}
      {isCorner && space.type === 'jail' && (
        <div className="absolute inset-0 flex flex-col">
          <div
            className="flex-1 bg-[var(--color-mono-orange)] flex items-start justify-start p-0.5"
            style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
          >
            <span className="text-[6px] font-black text-ink-900 leading-none">JAIL</span>
          </div>
          <div className="flex-1 flex items-end justify-end p-0.5">
            <span className="text-[6px] font-semibold text-ink-900/70 leading-none">Just Visiting</span>
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-[15px]">⛓️</span>
        </div>
      )}
      {isCorner && space.type === 'free_parking' && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[15px] leading-none">🅿️</span>
          <span className="text-[6.5px] font-display font-black text-ink-900 uppercase leading-tight">
            {space.name}
          </span>
        </div>
      )}
      {isCorner && space.type === 'go_to_jail' && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[15px] leading-none">👮</span>
          <span className="text-[6.5px] font-display font-black text-ink-900 uppercase leading-tight">
            {space.name}
          </span>
        </div>
      )}

      {!isCorner && (
        <div
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-0.5 overflow-hidden ${
            isSideColumn ? '[writing-mode:vertical-rl] rotate-180' : ''
          }`}
        >
          <span className="text-[6.5px] leading-tight font-bold text-ink-900 text-center line-clamp-2 uppercase">
            {space.name}
          </span>
          {space.type === 'railroad' && (
            <span className="text-[10px]">{TRANSPORT_ICONS[space.name] || '🚂'}</span>
          )}
          {space.type === 'utility' && (
            <span className="text-[10px]">{UTILITY_ICONS[space.name] || '💡'}</span>
          )}
          {space.type === 'chance' && (
            <span className="text-[14px] font-black text-[var(--color-mono-pink)]">?</span>
          )}
          {space.type === 'community_chest' && <span className="text-[11px]">🎁</span>}
          {space.type === 'tax' && <span className="text-[9px] text-ink-900/70">Rs {space.amount}</span>}
          {space.price && <span className="text-[6px] text-ink-900/60 font-mono-num">Rs {space.price}</span>}
        </div>
      )}

      {propState?.houses > 0 && (
        <div className="absolute top-[28%] left-0 right-0 flex justify-center gap-0.5 z-10">
          {propState.houses === 5 ? (
            <span className="text-[9px]">🏨</span>
          ) : (
            Array.from({ length: propState.houses }).map((_, i) => (
              <span key={i} className="text-[7px]">🏠</span>
            ))
          )}
        </div>
      )}

      {owner && (
        <div
          className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-white/60 z-10"
          style={{ background: PLAYER_COLOR_HEX[owner.color] }}
        />
      )}

      {occupants.length > 0 && (
        <div className="absolute bottom-0.5 left-0.5 flex -space-x-1 z-10">
          {occupants.map((p) => (
            <span
              key={p.id}
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/60 shadow"
              style={{ background: PLAYER_COLOR_HEX[p.color] }}
              title={p.name}
            />
          ))}
        </div>
      )}
    </button>
  );
}
