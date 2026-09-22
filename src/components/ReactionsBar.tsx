import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { ChatReaction } from '../types';

interface ReactionsBarProps {
  onSendReaction: (emoji?: string, text?: string) => void;
  reactions: ChatReaction[];
}

const QUICK_EMOJIS = ['🎉', '🍀', '🔥', '😱', '👏', '🎯', '✨'];
const QUICK_SHOUTS = ['1 away! 🤞', 'So close!', 'Need a B! 🎲', 'Good luck! 🍀', 'BINGO coming! ⚡'];

export const ReactionsBar: React.FC<ReactionsBarProps> = ({ onSendReaction, reactions }) => {
  const [showShouts, setShowShouts] = useState(false);

  return (
    <>
      {/* Floating live reaction bubbles */}
      <div className="fixed bottom-20 left-4 right-4 pointer-events-none z-40 overflow-hidden h-64 flex flex-col justify-end items-center sm:items-end">
        <AnimatePresence>
          {reactions.slice(-6).map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="mb-2.5 px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 backdrop-blur-md flex items-center gap-2 max-w-xs"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                boxShadow: `0 4px 14px ${reaction.playerColor}40`,
              }}
            >
              <span className="text-lg">{reaction.playerAvatar}</span>
              <span className="text-xs font-semibold text-white/80">{reaction.playerName}:</span>
              {reaction.emoji && <span className="text-xl">{reaction.emoji}</span>}
              {reaction.text && <span className="text-xs font-medium text-amber-300">{reaction.text}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Interactive Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline-flex items-center gap-1 pl-1 pr-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            React:
          </span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="p-1.5 hover:scale-125 active:scale-95 transition-all text-xl rounded-lg hover:bg-slate-800/80 flex items-center justify-center cursor-pointer"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowShouts(!showShouts)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl transition cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Shout</span>
          </button>

          {showShouts && (
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col gap-1.5 min-w-[140px] z-50 animate-in fade-in zoom-in-95 duration-150">
              {QUICK_SHOUTS.map((shout) => (
                <button
                  key={shout}
                  onClick={() => {
                    onSendReaction(undefined, shout);
                    setShowShouts(false);
                  }}
                  className="text-left px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  {shout}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
