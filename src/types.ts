export type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

export interface BingoBall {
  number: number;
  letter: BingoLetter;
  calledAt: number;
}

export interface BingoCell {
  row: number;
  col: number;
  number: number; // 0 for FREE space
  letter: BingoLetter;
  isFree: boolean;
}

export type WinningPattern = 'line' | 'corners' | 'blackout' | 'any';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  dauberColor: string;
  dauberSymbol: 'dot' | 'star' | 'heart' | 'clover' | 'gem';
  isHost: boolean;
  isReady: boolean;
  card: number[][]; // 5x5 numbers, 0 is FREE
  marks: boolean[][]; // 5x5 marked status
  linesCompleted: number;
  nearBingoCount: number; // cells remaining for closest win
  joinedAt: number;
}

export type GameStatus = 'lobby' | 'playing' | 'paused' | 'ended';

export interface ChatReaction {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  playerColor: string;
  text?: string;
  emoji?: string;
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  status: GameStatus;
  hostId: string;
  winningPattern: WinningPattern;
  autoCall: boolean;
  callSpeed: number; // in seconds (e.g. 4, 6, 8)
  calledBalls: BingoBall[];
  currentBall: BingoBall | null;
  players: Record<string, Player>;
  winner: {
    playerId: string;
    playerName: string;
    winningLines: { type: 'row' | 'col' | 'diag' | 'corners' | 'blackout'; index?: number }[];
    pattern: WinningPattern;
  } | null;
  recentReactions: ChatReaction[];
  roundNumber: number;
}

export type WSClientMessage =
  | { type: 'join_room'; roomId: string; player: { name: string; avatar: string; dauberColor: string; dauberSymbol: Player['dauberSymbol'] } }
  | { type: 'set_ready'; isReady: boolean }
  | { type: 'change_card'; card: number[][] }
  | { type: 'start_game'; winningPattern?: WinningPattern; autoCall?: boolean; callSpeed?: number }
  | { type: 'pause_game' }
  | { type: 'resume_game' }
  | { type: 'draw_ball' }
  | { type: 'mark_cell'; row: number; col: number; marked: boolean }
  | { type: 'claim_bingo' }
  | { type: 'send_reaction'; emoji?: string; text?: string }
  | { type: 'reset_round'; newPattern?: WinningPattern }
  | { type: 'update_settings'; winningPattern?: WinningPattern; autoCall?: boolean; callSpeed?: number };

export type WSServerMessage =
  | { type: 'room_state'; state: RoomState; yourId: string }
  | { type: 'ball_called'; ball: BingoBall; calledBalls: BingoBall[] }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; playerId: string; newHostId?: string }
  | { type: 'player_updated'; player: Player }
  | { type: 'game_started'; state: RoomState }
  | { type: 'game_paused' }
  | { type: 'game_resumed' }
  | { type: 'reaction'; reaction: ChatReaction }
  | { type: 'bingo_winner'; winner: RoomState['winner']; state: RoomState }
  | { type: 'bingo_invalid'; message: string }
  | { type: 'error'; message: string };
