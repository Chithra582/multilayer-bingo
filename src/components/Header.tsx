import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Users, HelpCircle, LogOut, SplitSquareVertical } from 'lucide-react';
import { BINGO_LETTERS, getLetterColorClasses } from '../utils/bingo';

interface HeaderProps {
  roomId: string | null;
  isConnected: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLeaveRoom?: () => void;
  onToggleDualMode?: () => void;
  isDualMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  isConnected,
  isMuted,
  onToggleMute,
  onLeaveRoom,
  onToggleDualMode,
  isDualMode = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleCopyRoom = () => {
    if (!roomId) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & letters */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-0.5">
              {BINGO_LETTERS.map((letter) => {
                const colors = getLetterColorClasses(letter);
                return (
                  <span
                    key={letter}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${colors.bg} text-white font-black text-xs sm:text-sm flex items-center justify-center shadow`}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
            <span className="font-extrabold text-white text-sm sm:text-base hidden md:inline">
              Multiplayer Bingo
            </span>
          </div>

          {/* Center: Room Code pill */}
          {roomId && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 sm:px-3.5 py-1 rounded-full shadow-inner">
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Room:</span>
              <span className="font-mono font-black text-xs sm:text-sm text-amber-400 tracking-wider">
                {roomId}
              </span>
              <button
                onClick={handleCopyRoom}
                className="ml-1 p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition cursor-pointer"
                title="Copy Invite Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Connection indicator */}
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-pulse'
              }`}
              title={isConnected ? 'Connected to live server' : 'Connecting...'}
            />

            {/* Dual Player mode toggle */}
            {onToggleDualMode && (
              <button
                onClick={onToggleDualMode}
                className={`p-2 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  isDualMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="2 Players on this device (Split Screen)"
              >
                <SplitSquareVertical className="w-4 h-4" />
                <span className="hidden lg:inline">{isDualMode ? 'Exit 2-Player' : '2-Player Split'}</span>
              </button>
            )}

            {/* Sound toggle */}
            <button
              onClick={onToggleMute}
              className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
              title={isMuted ? 'Unmute sound' : 'Mute sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Rules */}
            <button
              onClick={() => setShowRules(true)}
              className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Leave room */}
            {roomId && onLeaveRoom && (
              <button
                onClick={onLeaveRoom}
                className="p-2 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 rounded-xl border border-rose-500/30 transition cursor-pointer"
                title="Leave Room"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-200">
            <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              <span>🎯 How to Play Multiplayer Bingo</span>
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="font-bold text-amber-400 block mb-1">1. Invite Friends & Join Room</span>
                Share your 4-letter Room Code or copy the direct link. 2 or more players can join from any browser or phone tab simultaneously!
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="font-bold text-amber-400 block mb-1">2. Custom Cards & Daubers</span>
                Pick your lucky avatar, favorite dauber ink color, and stamp symbol before the host starts the round.
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="font-bold text-amber-400 block mb-1">3. Real-Time Number Calling</span>
                The live caller cage draws numbers from 1 to 75. Hear the voice announcer and watch the master ball board. Click each matching number on your card to daub it!
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="font-bold text-amber-400 block mb-1">4. Shout BINGO!</span>
                Complete 5 in a row (horizontal, vertical, diagonal), 4 corners, or blackout according to the chosen pattern. Tap CALL BINGO to claim victory!
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-5 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition cursor-pointer"
            >
              Got it! Let's Play
            </button>
          </div>
        </div>
      )}
    </>
  );
};
