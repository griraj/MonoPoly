import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gridPosition } from '../lib/boardLayout.js';
import Space from './Space.jsx';

const GRID_LINES = 11;
const STEP_MS = 160;

function normalizePlayerPositions(players) {
  return Object.fromEntries(players.map((player) => [player.id, player.position]));
}

function buildPositionMap(players, displayedPositions) {
  const map = new Map();
  players.forEach((player) => {
    const position = displayedPositions[player.id] ?? player.position;
    const list = map.get(position) || [];
    list.push(player);
    map.set(position, list);
  });
  return map;
}

function buildPath(start, end) {
  const path = [start];
  let current = start;
  while (current !== end) {
    current = (current + 1) % 40;
    path.push(current);
    if (path.length > 40) break;
  }
  return path;
}

export default function Board({ game, onSelectSpace, centerContent }) {
  const corners = new Set([0, 10, 20, 30]);
  const wrapperRef = useRef(null);
  const [boardSize, setBoardSize] = useState(0);
  const [displayedPositions, setDisplayedPositions] = useState(() => normalizePlayerPositions(game.players));
  const displayedPositionsRef = useRef(displayedPositions);
  const animationTimersRef = useRef(new Map());

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

  useEffect(() => {
    displayedPositionsRef.current = displayedPositions;
  }, [displayedPositions]);

  useEffect(() => {
    const previous = displayedPositionsRef.current;
    const current = normalizePlayerPositions(game.players);

    const nextDisplayed = { ...previous };
    game.players.forEach((player) => {
      if (previous[player.id] === undefined) {
        nextDisplayed[player.id] = player.position;
      }
    });
    setDisplayedPositions(nextDisplayed);

    game.players.forEach((player) => {
      const from = previous[player.id];
      const to = player.position;
      if (from !== undefined && from !== to) {
        const timers = animationTimersRef.current.get(player.id);
        if (timers) timers.forEach(clearTimeout);

        const path = buildPath(from, to);
        path.slice(1).forEach((position, idx) => {
          const timer = window.setTimeout(() => {
            setDisplayedPositions((prev) => ({ ...prev, [player.id]: position }));
          }, STEP_MS * (idx + 1));
          const existing = animationTimersRef.current.get(player.id) || [];
          animationTimersRef.current.set(player.id, [...existing, timer]);
        });
      }
    });

    return () => {
      animationTimersRef.current.forEach((timers) => timers.forEach(clearTimeout));
      animationTimersRef.current.clear();
    };
  }, [game.players]);

  const cell = boardSize ? boardSize / GRID_LINES : null;
  const playersBySpace = buildPositionMap(game.players, displayedPositions);

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
                displayedPlayers={playersBySpace.get(space.id) || []}
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
      </div>
    </div>
  );
}
