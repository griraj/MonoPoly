import { COLOR_HEX, PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

const ICONS = {
  chance: '❓',
  community_chest: '🎁',
  tax: '💰',
  jail: '🚔',
  go_to_jail: '👮',
  free_parking: '🅿️',
  go: '➡️',
};

export default function Space({ space, propState, players, displayedPlayers = [], onClick, isCorner }) {
  const owner = propState?.owner ? players.find((p) => p.id === propState.owner) : null;
  const occupants = displayedPlayers.filter((p) => !p.bankrupt);
  const isProperty = space.type === 'property';
  const isRailUtil = space.type === 'railroad' || space.type === 'utility';

  return (
    <button
      onClick={onClick}
      className={`relative flex h-full w-full flex-col bg-parchment-100 overflow-hidden text-left hover:brightness-105 transition ${
        isCorner ? 'items-center justify-center text-center p-1' : 'p-1'
      }`}
      style={{ minWidth: 0, minHeight: 0 }}
    >
      {isProperty && (
        <div className="relative h-[22%] w-full shrink-0" style={{ background: COLOR_HEX[space.color] }}>
          {owner && (
            <span
                className="absolute bottom-1 right-1 block rounded-full"
              style={{
                  width: '65%',
                  height: '0.35rem',
                background: PLAYER_COLOR_HEX[owner.color],
                boxShadow: '0 0 0 1px rgba(255,255,255,0.6)',
              }}
              title={owner.name}
            />
          )}
        </div>
      )}
      {propState?.mortgaged && (
        <div className="absolute top-0 left-0 right-0 h-[22%] bg-black/50 flex items-center justify-center">
          <span className="text-[7px] text-white font-bold tracking-wider">MORTGAGED</span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 px-0.5 overflow-hidden">
        {!isCorner && (
          <span className="text-[6.5px] leading-tight font-semibold text-ink-900 text-center line-clamp-2">
            {space.name}
          </span>
        )}
        {isCorner && (
          <span className="text-[9px] font-display font-bold text-ink-900 leading-tight">
            {ICONS[space.type] || ''} {space.name}
          </span>
        )}
        {isRailUtil && !isCorner && <span className="text-[10px]">{space.type === 'railroad' ? '🚂' : '💡'}</span>}
        {(space.type === 'chance' || space.type === 'community_chest') && !isCorner && (
          <span className="text-[11px]">{ICONS[space.type]}</span>
        )}
        {space.type === 'tax' && !isCorner && <span className="text-[9px] text-ink-900/90 font-semibold">${space.amount}</span>}
        {!isCorner && space.price && <span className="text-[6px] text-ink-900/85 font-mono-num">${space.price}</span>}
      </div>

      {propState?.houses > 0 && (
        <div className="absolute top-[24%] left-0 right-0 flex justify-center gap-0.5">
          {propState.houses === 5 ? (
            <span className="text-[9px]">🏨</span>
          ) : (
            Array.from({ length: propState.houses }).map((_, i) => (
              <span key={i} className="text-[7px]">🏠</span>
            ))
          )}
        </div>
      )}


      {occupants.length > 0 && (
        <div className="absolute bottom-1 left-1 flex items-center gap-1">
          {occupants.map((p) => (
            <span
              key={p.id}
              className="text-[14px] leading-none rounded-md px-1 py-0.5 ring-1 ring-white/60 shadow-sm"
              style={{ color: PLAYER_COLOR_HEX[p.color], backgroundColor: 'rgba(255,255,255,0.12)' }}
              title={p.name}
            >
              ♟
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
