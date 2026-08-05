// Maps a Monopoly space id (0-39) to a position in an 11x11 CSS grid.
// id 0 = GO = bottom-right corner. Board goes counter-clockwise like the real game.
export function gridPosition(id) {
  if (id <= 10) {
    // bottom row, right (col 11) to left (col 1)
    return { row: 11, col: 11 - id };
  }
  if (id <= 20) {
    // left column, bottom (row 11) to top (row 1)
    return { row: 11 - (id - 10), col: 1 };
  }
  if (id <= 30) {
    // top row, left (col 1) to right (col 11)
    return { row: 1, col: 1 + (id - 20) };
  }
  // right column, top (row 1) to bottom (row 11)
  return { row: 1 + (id - 30), col: 11 };
}

export const COLOR_HEX = {
  brown: 'var(--color-mono-brown)',
  lightblue: 'var(--color-mono-lightblue)',
  pink: 'var(--color-mono-pink)',
  orange: 'var(--color-mono-orange)',
  red: 'var(--color-mono-red)',
  yellow: 'var(--color-mono-yellow)',
  green: 'var(--color-mono-green)',
  darkblue: 'var(--color-mono-darkblue)',
};

export const PLAYER_COLOR_HEX = {
  red: 'var(--color-player-red)',
  blue: 'var(--color-player-blue)',
  green: 'var(--color-player-green)',
  yellow: 'var(--color-player-yellow)',
  purple: 'var(--color-player-purple)',
  orange: 'var(--color-player-orange)',
};
