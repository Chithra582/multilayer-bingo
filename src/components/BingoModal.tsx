import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { RoomState, WinningPattern } from '../types';
import { playBingoFanfare, playBuzzerSound } from '../utils/audio';

interface BingoModalProps {
  winner: RoomState['winner'];
  currentUserId: string;
  isHost: boolean;
  onNewRound: (newPattern?: WinningPattern) => void;
  invalidNotice: string | null;
  onDismissInvalidNotice: () => void;
}

export const BingoModal: React.FC<BingoModalProps> = ({
  winner,
  currentUserId,
  isHost,
  onNewRound,
  invalidNotice,
  onDismissInvalidNotice,
}) => {
  useEffect(() => {
    if (winner) {
      playBingoFanfare();
      // Trigger canvas confetti
      const end = Date.now() + 3000;
      const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [winner]);

  useEffect(() => {
    if (invalidNotice) {
      playBuzzerSound();
      const timer = setTimeout(() => {
        onDismissInvalidNotice();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [invalidNotice, onDismissInvalidNotice]);

  return (
    <>
      {/* Invalid Bingo Toast Notification */}
      <AnimatePresence>
        {invalidNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] bg-rose-950/95 border border-rose-500 text-rose-100 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-rose-200">Not BINGO Yet!</h4>
              <p className="text-xs text-rose-300/90 mt-0.5">{invalidNotice}</p>
            </div>
            <button
              onClick={onDismissInvalidNotice}
              className="text-xs text-rose-400 hover:text-rose-200 font-bold px-2 py-1"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-amber-400/80 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              {/* Decorative top badge */}
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg border-4 border-slate-900 mb-4 animate-bounce">
                <Trophy className="w-10 h-10 text-slate-950 fill-slate-950" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BINGO WINNER!</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                {winner.playerId === currentUserId ? '🎉 YOU WON! 🎉' : `${winner.playerName} Won!`}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mb-5">
                Completed the <span className="text-amber-400 capitalize font-bold">{winner.pattern}</span> pattern!
              </p>

              <div className="bg-slate-800/60 rounded-2xl p-3 mb-6 border border-slate-700/60 text-xs text-slate-400 flex items-center justify-around">
                <div>
                  <span className="block font-bold text-slate-200 text-sm">{winner.winningLines.length}</span>
                  <span>Winning Lines</span>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div>
                  <span className="block font-bold text-slate-200 text-sm capitalize">{winner.pattern}</span>
                  <span>Pattern Mode</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                {isHost ? (
                  <button
                    onClick={() => onNewRound()}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Play Next Round</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 py-2 italic">
                    Waiting for the host to start the next round...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
