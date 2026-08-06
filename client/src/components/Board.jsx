import { useLayoutEffect, useRef, useState } from 'react';
import { gridPosition } from '../lib/boardLayout.js';
import Space from './Space.jsx';

const GRID_LINES = 11;

export default function Board({ game, onSelectSpace, centerContent }) {
 const corners = new Set([0, 10, 20, 30]);
 const wrapperRef = useRef(null);
 const [boardSize, setBoardSize] = useState(0);

 // Snap the board size to an exact layout with 11 equal tracks. This keeps each
 // space the same whole-pixel width and height, and avoids any visible gaps
 // or grid lines between the tiles.
 useLayoutEffect(() => {
   const wrapper = wrapperRef.current;
   if (!wrapper) return;

   const updateSize = () => {
     const { width, height } = wrapper.getBoundingClientRect();
     const available = Math.floor(Math.min(width, height));
     const cell = Math.floor(available / GRID_LINES);
     const snapped = cell * GRID_LINES;
     setBoardSize(snapped > 0 ? snapped : available);
   };

   updateSize();
   const observer = new ResizeObserver(updateSize);
   observer.observe(wrapper);
   return () => observer.disconnect();
 }, []);

 const cell = boardSize ? boardSize / GRID_LINES : null;

  return (
    <div ref={wrapperRef} className="w-full aspect-square flex items-center justify-center">
      <div
        className="grid bg-felt-900 felt-texture rounded-xl shadow-2xl border-4 border-gold-600/60 overflow-hidden box-border"
        style={{
          width: boardSize || '100%',
          height: boardSize || '100%',
          visibility: boardSize ? 'visible' : 'hidden',
          gridTemplateColumns: `repeat(${GRID_LINES}, ${cell ? `${cell}px` : '1fr'})`,
          gridTemplateRows: `repeat(${GRID_LINES}, ${cell ? `${cell}px` : '1fr'})`,
        }}
      >
        {game.board.map((space) => {
          const { row, col } = gridPosition(space.id);
          return (
            <div key={space.id} style={{ gridRow: row, gridColumn: col }} className="min-w-0 min-h-0 h-full w-full">
              <Space
                space={space}
                propState={game.properties[space.id]}
                players={game.players}
                isCorner={corners.has(space.id)}
                onClick={() => onSelectSpace(space.id)}
              />
            </div>
          );
        })}
        <div
          style={{ gridRow: '2 / span 9', gridColumn: '2 / span 9' }}
          className="bg-felt-900 felt-texture flex flex-col items-center justify-center relative"
        >
          {centerContent}
        </div>
      </div>    </div>
  );
}