import { useEffect, useState } from 'react';

const PIPS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [25, 75], [75, 25], [75, 75]],
  5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
  6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
};

function Die({ value, rolling }) {
  return (
    <div
      className={`w-12 h-12 sm:w-14 sm:h-14 bg-parchment-50 rounded-lg shadow-lg relative border border-ink-900/10 ${
        rolling ? 'animate-dice-roll' : ''
      }`}
    >
      {(PIPS[value] || PIPS[1]).map(([x, y], i) => (
        <span
          key={i}
          className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-ink-900"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </div>
  );
}

export default function DiceTray({ dice, rollTrigger }) {
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (rollTrigger === undefined) return;
    setRolling(true);
    const t = setTimeout(() => setRolling(false), 500);
    return () => clearTimeout(t);
  }, [rollTrigger]);

  return (
    <div className="flex gap-3">
      <Die value={dice[0]} rolling={rolling} />
      <Die value={dice[1]} rolling={rolling} />
    </div>
  );
}
