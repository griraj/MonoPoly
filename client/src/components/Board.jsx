import { gridPosition, edgeForId } from '../lib/boardLayout.js';
import Space from './Space.jsx';

export default function Board({ game, onSelectSpace, centerContent }) {
  const corners = new Set([0, 10, 20, 30]);
  return (
    <div
      className="grid aspect-square w-full bg-parchment-100 rounded-md shadow-2xl border-2 border-ink-900 overflow-hidden"
      style={{
        gridTemplateColumns: 'repeat(11, 1fr)',
        gridTemplateRows: 'repeat(11, 1fr)',
      }}
    >
      {game.board.map((space) => {
        const { row, col } = gridPosition(space.id);
        return (
          <div key={space.id} style={{ gridRow: row, gridColumn: col }} className="min-w-0 min-h-0">
            <Space
              space={space}
              propState={game.properties[space.id]}
              players={game.players}
              isCorner={corners.has(space.id)}
              edge={edgeForId(space.id)}
              onClick={() => onSelectSpace(space.id)}
            />
          </div>
        );
      })}
      <div
        style={{ gridRow: '2 / span 9', gridColumn: '2 / span 9' }}
        className="grass-board flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* decorative corner badges, in the spirit of the reference but original artwork */}
        <div className="absolute top-[10%] left-[10%] w-[16%] aspect-square rotate-45 bg-[var(--color-mono-lightblue)] border-2 border-ink-900 flex items-center justify-center shadow-md">
          <span className="-rotate-45 font-display font-black text-ink-900 text-[3vw]">Rs</span>
        </div>
        <div className="absolute bottom-[10%] right-[10%] w-[13%] aspect-square rotate-45 bg-[var(--color-mono-orange)] border-2 border-ink-900 flex items-center justify-center shadow-md">
          <span className="-rotate-45 font-display font-black text-ink-900 text-[2.4vw]">?</span>
        </div>

        <div className="relative z-10 rotate-[-24deg] flex flex-col items-center">
          <div className="bg-[var(--color-mono-darkblue)] border-[3px] border-ink-900 rounded-sm px-[6%] py-[3%] shadow-lg">
            <span className="business-watermark font-black text-white text-[6vw] leading-none select-none whitespace-nowrap tracking-tight">
              BUSINESS
            </span>
          </div>
          <span className="mt-1.5 text-ink-900/70 font-semibold text-[0.9vw] tracking-widest uppercase">
            Pakistan Edition
          </span>
        </div>

        <div className="relative z-10 mt-4">{centerContent}</div>
      </div>
    </div>
  );
}
