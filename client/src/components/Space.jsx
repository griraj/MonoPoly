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

export default function Space({ space, propState, players, onClick, onSelectPlayer, isCorner }) {
  const owner = propState?.owner ? players.find((p) => p.id === propState.owner) : null;
  const occupants = players.filter((p) => !p.bankrupt && p.position === space.id);
  const isProperty = space.type === 'property';
  const isRailUtil = space.type === 'railroad' || space.type === 'utility';

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col bg-parchment-100 border border-ink-900/20 overflow-hidden text-left hover:brightness-105 transition ${
        isCorner ? 'items-center justify-center text-center p-1' : 'p-1'
      }`}
      style={{ minWidth: 0, minHeight: 0 }}
    >
      {isProperty && (
        <div className="h-[22%] w-full shrink-0" style={{ background: COLOR_HEX[space.color] }} />
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
        {space.type === 'tax' && !isCorner && <span className="text-[9px] text-ink-900/70">${space.amount}</span>}
        {!isCorner && space.price && <span className="text-[6px] text-ink-900/60 font-mono-num">${space.price}</span>}
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

      {owner && (
        <div
          className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-white/40"
          style={{ background: PLAYER_COLOR_HEX[owner.color] }}
        />
      )}

      {occupants.length > 0 && (
        <div className="absolute bottom-0.5 left-0.5 flex -space-x-1">
          {occupants.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlayer?.(p.id);
              }}
              title={`View ${p.name}'s properties`}
              className="flex items-center justify-center w-5 h-5 rounded-full ring-1 ring-white/60 shadow-lg text-[10px] font-bold"
              style={{ background: PLAYER_COLOR_HEX[p.color], color: '#111' }}
            >
              ♟
            </button>
          ))}
        </div>
      )}
    </button>
  );
}
