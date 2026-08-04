import { gridPosition } from '../lib/boardLayout.js';
import Space from './Space.jsx';

export default function Board({ game, onSelectSpace, onSelectPlayer, centerContent }) {
  const corners = new Set([0, 10, 20, 30]);
  return (
    <div
      className="grid aspect-square w-full bg-parchment-50 rounded-xl shadow-2xl border-4 border-gold-600/60 overflow-hidden"
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
              onClick={() => onSelectSpace(space.id)}
              onSelectPlayer={onSelectPlayer}
            />
          </div>
        );
      })}
      <div
        style={{ gridRow: '2 / span 9', gridColumn: '2 / span 9' }}
        className="bg-felt-900 felt-texture rounded-lg m-1 flex flex-col items-center justify-center relative"
      >
        {centerContent}
      </div>
    </div>
  );
}
