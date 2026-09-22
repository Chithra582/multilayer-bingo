import React from 'react';
import { motion } from 'motion/react';
import { BINGO_LETTERS, getLetterColorClasses } from '../utils/bingo';
import { playDaubSound } from '../utils/audio';
import { Player, WinningPattern } from '../types';
import { Star, Heart, Clover, Gem, CircleCheck } from 'lucide-react';

interface BingoCardProps {
  player: Player;
  calledNumbersSet: Set<number>;
  winningPattern: WinningPattern;
  gameStatus: 'lobby' | 'playing' | 'paused' | 'ended';
  onToggleMark: (row: number, col: number) => void;
  onClaimBingo: () => void;
  isCurrentUser: boolean;
  compact?: boolean;
}

export const BingoCard: React.FC<BingoCardProps> = ({
  player,
  calledNumbersSet,
  winningPattern,
  gameStatus,
  onToggleMark,
  onClaimBingo,
  isCurrentUser,
  compact = false,
}) => {
  const { card, marks, dauberColor, dauberSymbol } = player;

  const handleCellClick = (r: number, c: number) => {
    if (!isCurrentUser || gameStatus === 'lobby' || (r === 2 && c === 2)) return;
    playDaubSound();
    onToggleMark(r, c);
  };

  const renderDaubSymbol = () => {
    switch (dauberSymbol) {
      case 'star':
        return <Star className="w-5 h-5 fill-current text-white drop-shadow" />;
      case 'heart':
        return <Heart className="w-5 h-5 fill-current text-white drop-shadow" />;
      case 'clover':
        return <Clover className="w-5 h-5 fill-current text-white drop-shadow" />;
      case 'gem':
        return <Gem className="w-5 h-5 fill-current text-white drop-shadow" />;
      default:
        return <CircleCheck className="w-5 h-5 text-white drop-shadow" />;
    }
  };

  const isBingoReady = player.nearBingoCount === 0 || player.linesCompleted > 0;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Card Header Frame */}
      <div className="w-full bg-slate-900/90 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-700/80 backdrop-blur-md">
        {/* Player Tag */}
        <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl p-1 bg-slate-800 rounded-full">{player.avatar}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 text-sm sm:text-base">{player.name}</span>
                {isCurrentUser && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                    You
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Pattern: <span className="text-amber-400 capitalize font-medium">{winningPattern}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-slate-300">
              {player.nearBingoCount === 0 ? (
                <span className="text-emerald-400 animate-pulse font-bold">⭐ BINGO READY!</span>
              ) : (
                <span className="text-amber-300 font-medium">{player.nearBingoCount} away</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">{player.linesCompleted} line(s) completed</div>
          </div>
        </div>

        {/* B-I-N-G-O Columns Header */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 my-2.5">
          {BINGO_LETTERS.map((letter) => {
            const colors = getLetterColorClasses(letter);
            return (
              <div
                key={letter}
                className={`${colors.bg} text-white font-black text-center py-2 sm:py-2.5 rounded-xl text-lg sm:text-2xl tracking-wider shadow-md flex items-center justify-center`}
              >
                {letter}
              </div>
            );
          })}
        </div>

        {/* 5x5 Number Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 select-none">
          {card.map((row, r) =>
            row.map((num, c) => {
              const isFree = r === 2 && c === 2;
              const isMarked = marks[r][c];
              const isCalled = isFree || calledNumbersSet.has(num);
              const letter = BINGO_LETTERS[c];
              const colorInfo = getLetterColorClasses(letter);

              // Uncalled number marked by mistake or uncalled number
              const shouldPulseClue = isCalled && !isMarked && !isFree && gameStatus === 'playing';

              return (
                <motion.button
                  key={`${r}-${c}`}
                  type="button"
                  whileTap={isCurrentUser && !isFree ? { scale: 0.94 } : undefined}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!isCurrentUser || isFree}
                  className={`relative aspect-square rounded-xl sm:rounded-2xl font-bold flex flex-col items-center justify-center transition-all duration-200 border text-center ${
                    isFree
                      ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/40 border-amber-400/50 text-amber-200 shadow-inner'
                      : isMarked
                      ? 'bg-slate-800/90 border-slate-600 text-white'
                      : shouldPulseClue
                      ? 'bg-amber-500/10 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 animate-pulse'
                      : 'bg-slate-800/50 hover:bg-slate-850 border-slate-700/60 text-slate-200 hover:border-slate-500'
                  } ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-xl'} ${
                    isCurrentUser && !isFree ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {isFree ? (
                    <div className="flex flex-col items-center justify-center p-0.5">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-spin-slow" />
                      <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-300 uppercase">
                        FREE
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Cell number */}
                      <span
                        className={`relative z-10 transition-opacity ${
                          isMarked ? 'opacity-40 text-xs sm:text-sm -translate-y-2 sm:-translate-y-3' : 'opacity-90'
                        }`}
                      >
                        {num}
                      </span>

                      {/* Daub Stamp */}
                      {isMarked && (
                        <motion.div
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                          className="absolute inset-0 m-auto w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 z-20"
                          style={{
                            backgroundColor: dauberColor,
                            boxShadow: `0 0 15px ${dauberColor}90`,
                          }}
                        >
                          {renderDaubSymbol()}
                        </motion.div>
                      )}

                      {/* Gentle clue indicator for called number that player hasn't daubed */}
                      {shouldPulseClue && (
                        <span className="absolute bottom-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </>
                  )}
                </motion.button>
              );
            })
          )}
        </div>

        {/* Claim BINGO Action Area */}
        {isCurrentUser && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col items-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onClaimBingo}
              disabled={gameStatus !== 'playing' && gameStatus !== 'paused'}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-lg sm:text-xl tracking-wider uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                isBingoReady
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white shadow-rose-500/40 animate-bounce'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>🎉 CALL BINGO! 🎉</span>
            </motion.button>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              {isBingoReady
                ? '⭐ Line complete! Tap Call Bingo to claim victory!'
                : 'Tap numbers as they are called. Tap CALL BINGO when you complete a pattern!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
