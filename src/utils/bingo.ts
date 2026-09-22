import { BingoBall, BingoLetter, WinningPattern } from '../types';

export const BINGO_LETTERS: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];

export const LETTER_RANGES: Record<BingoLetter, [number, number]> = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

export function getBingoLetter(num: number): BingoLetter {
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
}

export function getLetterColorClasses(letter: BingoLetter): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  glow: string;
} {
  switch (letter) {
    case 'B':
      return {
        bg: 'bg-blue-600',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500',
        badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30',
        glow: 'shadow-blue-500/30',
      };
    case 'I':
      return {
        bg: 'bg-rose-600',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500',
        badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30',
        glow: 'shadow-rose-500/30',
      };
    case 'N':
      return {
        bg: 'bg-amber-600',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500',
        badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30',
        glow: 'shadow-amber-500/30',
      };
    case 'G':
      return {
        bg: 'bg-emerald-600',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500',
        badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30',
        glow: 'shadow-emerald-500/30',
      };
    case 'O':
      return {
        bg: 'bg-purple-600',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500',
        badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/30',
        glow: 'shadow-purple-500/30',
      };
  }
}

// Generate random unique numbers from min to max
function getRandomUniqueNumbers(min: number, max: number, count: number): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/**
 * Generate standard 5x5 Bingo Card
 * Row x Col matrix:
 * Col 0: B (1-15)
 * Col 1: I (16-30)
 * Col 2: N (31-45), cell [2][2] is 0 (FREE)
 * Col 3: G (46-60)
 * Col 4: O (61-75)
 */
export function generateBingoCard(): number[][] {
  const card: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));

  BINGO_LETTERS.forEach((letter, colIdx) => {
    const [min, max] = LETTER_RANGES[letter];
    const nums = getRandomUniqueNumbers(min, max, 5);
    for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
      card[rowIdx][colIdx] = nums[rowIdx];
    }
  });

  // Center is FREE (0)
  card[2][2] = 0;
  return card;
}

export function createInitialMarks(): boolean[][] {
  const marks = Array.from({ length: 5 }, () => Array(5).fill(false));
  // Center is always marked FREE
  marks[2][2] = true;
  return marks;
}

export interface WinningLine {
  type: 'row' | 'col' | 'diag' | 'corners' | 'blackout';
  index?: number;
  cells: [number, number][];
}

/**
 * Verify marks against winning patterns
 */
export function checkWin(
  marks: boolean[][],
  pattern: WinningPattern
): { isWinner: boolean; winningLines: WinningLine[] } {
  const winningLines: WinningLine[] = [];

  // Check 5 rows
  for (let r = 0; r < 5; r++) {
    if (marks[r].every((val) => val)) {
      winningLines.push({
        type: 'row',
        index: r,
        cells: [
          [r, 0],
          [r, 1],
          [r, 2],
          [r, 3],
          [r, 4],
        ],
      });
    }
  }

  // Check 5 columns
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => marks[r][c])) {
      winningLines.push({
        type: 'col',
        index: c,
        cells: [
          [0, c],
          [1, c],
          [2, c],
          [3, c],
          [4, c],
        ],
      });
    }
  }

  // Check Main Diagonal (top-left to bottom-right)
  if ([0, 1, 2, 3, 4].every((i) => marks[i][i])) {
    winningLines.push({
      type: 'diag',
      index: 0,
      cells: [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ],
    });
  }

  // Check Anti-Diagonal (top-right to bottom-left)
  if ([0, 1, 2, 3, 4].every((i) => marks[i][4 - i])) {
    winningLines.push({
      type: 'diag',
      index: 1,
      cells: [
        [0, 4],
        [1, 3],
        [2, 2],
        [3, 1],
        [4, 0],
      ],
    });
  }

  // Corners
  const cornersValid = marks[0][0] && marks[0][4] && marks[4][0] && marks[4][4];
  if (cornersValid) {
    winningLines.push({
      type: 'corners',
      cells: [
        [0, 0],
        [0, 4],
        [4, 0],
        [4, 4],
      ],
    });
  }

  // Blackout
  const allMarked = marks.every((row) => row.every((c) => c));
  if (allMarked) {
    winningLines.push({
      type: 'blackout',
      cells: [],
    });
  }

  let isWinner = false;
  if (pattern === 'line' || pattern === 'any') {
    isWinner = winningLines.some((l) => l.type === 'row' || l.type === 'col' || l.type === 'diag');
  } else if (pattern === 'corners') {
    isWinner = cornersValid;
  } else if (pattern === 'blackout') {
    isWinner = allMarked;
  }

  return { isWinner, winningLines };
}

/**
 * Server-authoritative check: verifies whether the winning pattern's numbers
 * were ACTUALLY called by the server, preventing bogus claims!
 */
export function verifyWinAgainstCalledBalls(
  card: number[][],
  calledNumbersSet: Set<number>,
  pattern: WinningPattern
): { isValid: boolean; winningLines: WinningLine[] } {
  // Build effective marks: a cell is marked only if it is FREE (0) OR called
  const effectiveMarks: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(false));
  effectiveMarks[2][2] = true; // FREE

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) continue;
      const num = card[r][c];
      if (calledNumbersSet.has(num)) {
        effectiveMarks[r][c] = true;
      }
    }
  }

  const result = checkWin(effectiveMarks, pattern);
  return { isValid: result.isWinner, winningLines: result.winningLines };
}

/**
 * Calculate minimum numbers needed to complete any winning line
 */
export function calculateRemainingToWin(marks: boolean[][]): number {
  let minRemaining = 5;

  // Rows
  for (let r = 0; r < 5; r++) {
    const unmark = marks[r].filter((m) => !m).length;
    if (unmark < minRemaining) minRemaining = unmark;
  }
  // Cols
  for (let c = 0; c < 5; c++) {
    const unmark = [0, 1, 2, 3, 4].filter((r) => !marks[r][c]).length;
    if (unmark < minRemaining) minRemaining = unmark;
  }
  // Diag 1
  const diag1Unmark = [0, 1, 2, 3, 4].filter((i) => !marks[i][i]).length;
  if (diag1Unmark < minRemaining) minRemaining = diag1Unmark;
  // Diag 2
  const diag2Unmark = [0, 1, 2, 3, 4].filter((i) => !marks[i][4 - i]).length;
  if (diag2Unmark < minRemaining) minRemaining = diag2Unmark;

  return minRemaining;
}
