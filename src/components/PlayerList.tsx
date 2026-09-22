import React from 'react';
import { Player, WinningPattern } from '../types';
import { Crown, CheckCircle2, Circle, Flame, Sparkles } from 'lucide-react';

interface PlayerListProps {
  players: Record<string, Player>;
  currentUserId: string;
  hostId: string;
  gameStatus: 'lobby' | 'playing' | 'paused' | 'ended';
  winningPattern: WinningPattern;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentUserId,
  hostId,
  gameStatus,
  winningPattern,
}) => {
  const playerList = Object.values(players).sort((a, b) => {
    // Current user first, then host, then by progress
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    if (a.id === hostId) return -1;
    if (b.id === hostId) return 1;
    return a.nearBingoCount - b.nearBingoCount;
  });

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 border border-slate-700/80 shadow-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white">Players</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {playerList.length} Connected
          </span>
        </div>
        <span className="text-[11px] text-slate-400 capitalize">Pattern: {winningPattern}</span>
      </div>

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
        {playerList.map((player) => {
          const isUser = player.id === currentUserId;
          const isPlayerHost = player.id === hostId;
          const isVeryClose = player.nearBingoCount <= 1 && gameStatus === 'playing';

          // Count marked cells (excluding free)
          const markedCount = player.marks.flat().filter(Boolean).length;

          return (
            <div
              key={player.id}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isUser
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60'
              } ${isVeryClose ? 'ring-1 ring-amber-400/50' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-lg shadow-inner">
                    {player.avatar}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow"
                    style={{ backgroundColor: player.dauberColor }}
                    title={`Dauber color: ${player.dauberColor}`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                      {player.name}
                    </span>
                    {isUser && (
                      <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-indigo-500/30 text-indigo-300 rounded border border-indigo-500/40">
                        You
                      </span>
                    )}
                    {isPlayerHost && (
                      <span title="Room Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    {gameStatus === 'lobby' ? (
                      player.isReady ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Circle className="w-3 h-3" /> Choosing Card
                        </span>
                      )
                    ) : (
                      <span>{markedCount}/25 marked</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress badge */}
              {gameStatus !== 'lobby' && (
                <div className="text-right shrink-0">
                  {player.nearBingoCount === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> BINGO READY!
                    </span>
                  ) : player.nearBingoCount === 1 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Flame className="w-3 h-3 text-amber-400" /> 1 AWAY!
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      {player.nearBingoCount} away
                    </span>
                  )}
                  {player.linesCompleted > 0 && (
                    <div className="text-[10px] text-indigo-300 font-medium mt-0.5">
                      {player.linesCompleted} line(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
