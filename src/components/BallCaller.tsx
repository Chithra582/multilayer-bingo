import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BingoBall, GameStatus } from '../types';
import { getLetterColorClasses } from '../utils/bingo';
import { Play, Pause, FastForward, Clock, Volume2, VolumeX, Mic } from 'lucide-react';

interface BallCallerProps {
  currentBall: BingoBall | null;
  calledBalls: BingoBall[];
  gameStatus: GameStatus;
  isHost: boolean;
  autoCall: boolean;
  callSpeed: number;
  onDrawBall: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onChangeSpeed: (speed: number) => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
}

export const BallCaller: React.FC<BallCallerProps> = ({
  currentBall,
  calledBalls,
  gameStatus,
  isHost,
  autoCall,
  callSpeed,
  onDrawBall,
  onPauseGame,
  onResumeGame,
  onChangeSpeed,
  isVoiceActive,
  onToggleVoice,
}) => {
  const recentBalls = calledBalls.slice(-6, -1).reverse();
  const [secondsRemaining, setSecondsRemaining] = useState(callSpeed);

  useEffect(() => {
    if (gameStatus !== 'playing' || !autoCall) {
      setSecondsRemaining(callSpeed);
      return;
    }

    setSecondsRemaining(callSpeed);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : callSpeed));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBall, gameStatus, autoCall, callSpeed]);

  const currentColor = currentBall ? getLetterColorClasses(currentBall.letter) : null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-700/80 shadow-2xl flex flex-col gap-4">
      {/* Top status bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Status:</span>
          <span className="capitalize font-semibold text-slate-200">
            {gameStatus === 'playing' ? 'Live Calling' : gameStatus}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
              isVoiceActive
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle caller voice speech"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice Caller</span>
          </button>

          <span className="font-semibold text-slate-300">
            {calledBalls.length} / 75 <span className="text-slate-500">Called</span>
          </span>
        </div>
      </div>

      {/* Main Ball Display Stage */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
        {/* The Current Ball */}
        <div className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            {currentBall ? (
              <motion.div
                key={`${currentBall.letter}-${currentBall.number}`}
                initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="relative flex items-center justify-center"
              >
                {/* Glow ring */}
                <div
                  className={`absolute -inset-2 rounded-full blur-xl opacity-60 ${currentColor?.bg}`}
                />

                {/* 3D Ball Sphere */}
                <div
                  className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-2xl border-4 border-white/40 flex flex-col items-center justify-center text-white ${currentColor?.bg}`}
                  style={{
                    background: `radial-gradient(circle at 35% 30%, #ffffff88 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.5) 100%)`,
                  }}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950/90 shadow-inner flex flex-col items-center justify-center border-2 border-white/20">
                    <span className="text-xs sm:text-sm font-black tracking-widest text-slate-300">
                      {currentBall.letter}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-md -mt-1">
                      {currentBall.number}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                <span className="text-2xl mb-1">🎱</span>
                <span className="text-xs font-semibold">Waiting...</span>
              </div>
            )}
          </AnimatePresence>

          {/* Auto call countdown timer */}
          {gameStatus === 'playing' && autoCall && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Next ball in:</span>
              <span className="font-bold text-amber-400 font-mono text-sm">{secondsRemaining}s</span>
            </div>
          )}
        </div>

        {/* Previous Balls Queue */}
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Previous Balls
          </span>
          <div className="flex items-center gap-2">
            {recentBalls.length > 0 ? (
              recentBalls.map((b) => {
                const colors = getLetterColorClasses(b.letter);
                return (
                  <motion.div
                    key={`${b.letter}-${b.number}`}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-white shadow-md border border-white/30 text-xs font-bold ${colors.bg}`}
                  >
                    <span className="text-[8px] leading-none opacity-80">{b.letter}</span>
                    <span className="text-xs leading-none">{b.number}</span>
                  </motion.div>
                );
              })
            ) : (
              <span className="text-xs text-slate-500 italic">No previous balls yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Host Controls Section */}
      {isHost && (
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {gameStatus === 'playing' ? (
              <button
                onClick={onPauseGame}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : gameStatus === 'paused' ? (
              <button
                onClick={onResumeGame}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            ) : null}

            <button
              onClick={onDrawBall}
              disabled={gameStatus === 'ended'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Draw Next Ball</span>
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="hidden sm:inline">Speed:</span>
            {[
              { label: '3s', val: 3 },
              { label: '5s', val: 5 },
              { label: '8s', val: 8 },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => onChangeSpeed(s.val)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  callSpeed === s.val
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
