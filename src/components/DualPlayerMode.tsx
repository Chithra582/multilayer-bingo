import React, { useState, useEffect } from 'react';
import { BingoBall, WinningPattern } from '../types';
import { generateBingoCard, createInitialMarks, getBingoLetter, checkWin, calculateRemainingToWin } from '../utils/bingo';
import { playBallDropSound, playBingoFanfare, playDaubSound, speakBall } from '../utils/audio';
import { BingoCard } from './BingoCard';
import { Trophy, RefreshCw, Play, Pause, FastForward, SplitSquareVertical } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DualPlayerModeProps {
  onExit: () => void;
}

export const DualPlayerMode: React.FC<DualPlayerModeProps> = ({ onExit }) => {
  const [calledBalls, setCalledBalls] = useState<BingoBall[]>([]);
  const [calledNumbersSet, setCalledNumbersSet] = useState<Set<number>>(new Set());
  const [ballPool, setBallPool] = useState<number[]>([]);
  const [currentBall, setCurrentBall] = useState<BingoBall | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  // Player 1
  const [p1Card, setP1Card] = useState<number[][]>(() => generateBingoCard());
  const [p1Marks, setP1Marks] = useState<boolean[][]>(() => createInitialMarks());

  // Player 2
  const [p2Card, setP2Card] = useState<number[][]>(() => generateBingoCard());
  const [p2Marks, setP2Marks] = useState<boolean[][]>(() => createInitialMarks());

  // Initialize pool
  useEffect(() => {
    initNewRound();
  }, []);

  const initNewRound = () => {
    const pool = Array.from({ length: 75 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setBallPool(pool);
    setCalledBalls([]);
    setCalledNumbersSet(new Set());
    setCurrentBall(null);
    setP1Card(generateBingoCard());
    setP1Marks(createInitialMarks());
    setP2Card(generateBingoCard());
    setP2Marks(createInitialMarks());
    setWinnerName(null);
    setIsPlaying(false);
  };

  const drawBall = () => {
    if (ballPool.length === 0 || winnerName) return;
    const nextPool = [...ballPool];
    const num = nextPool.pop()!;
    const ball: BingoBall = {
      number: num,
      letter: getBingoLetter(num),
      calledAt: Date.now(),
    };

    setBallPool(nextPool);
    setCurrentBall(ball);
    setCalledBalls((prev) => [...prev, ball]);
    setCalledNumbersSet((prev) => new Set([...prev, num]));
    playBallDropSound();
    speakBall(ball);
  };

  // Auto-caller timer
  useEffect(() => {
    if (!isPlaying || winnerName) return;
    const interval = setInterval(() => {
      drawBall();
    }, speed * 1000);
    return () => clearInterval(interval);
  }, [isPlaying, ballPool, winnerName, speed]);

  const toggleP1Mark = (r: number, c: number) => {
    const next = p1Marks.map((row, ri) => row.map((val, ci) => (ri === r && ci === c ? !val : val)));
    setP1Marks(next);
  };

  const toggleP2Mark = (r: number, c: number) => {
    const next = p2Marks.map((row, ri) => row.map((val, ci) => (ri === r && ci === c ? !val : val)));
    setP2Marks(next);
  };

  const checkP1Win = () => {
    const res = checkWin(p1Marks, 'line');
    if (res.isWinner) {
      celebrateWin('Player 1 (Left)');
    } else {
      alert('Not yet Player 1! Complete a full line of called numbers.');
    }
  };

  const checkP2Win = () => {
    const res = checkWin(p2Marks, 'line');
    if (res.isWinner) {
      celebrateWin('Player 2 (Right)');
    } else {
      alert('Not yet Player 2! Complete a full line of called numbers.');
    }
  };

  const celebrateWin = (name: string) => {
    setIsPlaying(false);
    setWinnerName(name);
    playBingoFanfare();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const p1PlayerObj = {
    id: 'p1',
    name: 'Player 1',
    avatar: '🦁',
    dauberColor: '#ef4444',
    dauberSymbol: 'star' as const,
    isHost: true,
    isReady: true,
    card: p1Card,
    marks: p1Marks,
    linesCompleted: checkWin(p1Marks, 'line').winningLines.length,
    nearBingoCount: calculateRemainingToWin(p1Marks),
    joinedAt: Date.now(),
  };

  const p2PlayerObj = {
    id: 'p2',
    name: 'Player 2',
    avatar: '🦊',
    dauberColor: '#10b981',
    dauberSymbol: 'heart' as const,
    isHost: false,
    isReady: true,
    card: p2Card,
    marks: p2Marks,
    linesCompleted: checkWin(p2Marks, 'line').winningLines.length,
    nearBingoCount: calculateRemainingToWin(p2Marks),
    joinedAt: Date.now(),
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">2-Player Shared Screen Mode</h2>
            <p className="text-xs text-slate-400">Two players playing side-by-side on this device!</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Controls */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              isPlaying
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Start Auto Call'}</span>
          </button>

          <button
            onClick={drawBall}
            disabled={isPlaying || ballPool.length === 0}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <FastForward className="w-4 h-4" />
            <span>Draw Ball</span>
          </button>

          <button
            onClick={initNewRound}
            className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
            title="Reset Game"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onExit}
            className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            Back to Online
          </button>
        </div>
      </div>

      {/* Center Shared Ball Display */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Ball:</span>
          {currentBall ? (
            <div className="flex items-center gap-2">
              <span className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-white/40">
                {currentBall.letter}-{currentBall.number}
              </span>
              <span className="text-xs text-slate-400">({calledBalls.length} called)</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Press Start or Draw Ball</span>
          )}
        </div>

        {/* Previous balls */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm">
          <span className="text-[11px] text-slate-500 mr-1">Recent:</span>
          {calledBalls.slice(-5).reverse().map((b) => (
            <span
              key={`${b.letter}-${b.number}`}
              className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700"
            >
              {b.letter}{b.number}
            </span>
          ))}
        </div>
      </div>

      {/* Winner Banner */}
      {winnerName && (
        <div className="bg-amber-500/20 border-2 border-amber-400 text-amber-200 p-4 rounded-3xl text-center shadow-xl animate-bounce flex items-center justify-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          <span className="font-black text-lg sm:text-xl">🏆 {winnerName} WON BINGO! 🏆</span>
          <button
            onClick={initNewRound}
            className="ml-4 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Split Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Player 1 Card */}
        <div className="flex flex-col items-center">
          <BingoCard
            player={p1PlayerObj}
            calledNumbersSet={calledNumbersSet}
            winningPattern="line"
            gameStatus="playing"
            onToggleMark={toggleP1Mark}
            onClaimBingo={checkP1Win}
            isCurrentUser={true}
          />
        </div>

        {/* Player 2 Card */}
        <div className="flex flex-col items-center">
          <BingoCard
            player={p2PlayerObj}
            calledNumbersSet={calledNumbersSet}
            winningPattern="line"
            gameStatus="playing"
            onToggleMark={toggleP2Mark}
            onClaimBingo={checkP2Win}
            isCurrentUser={true}
          />
        </div>
      </div>
    </div>
  );
};
