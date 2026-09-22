import React, { useState } from 'react';
import { Player, WinningPattern } from '../types';
import { generateBingoCard } from '../utils/bingo';
import { Users, Play, Shuffle, Sparkles, Star, Heart, Clover, Gem, CircleDot, Crown, CheckCircle2 } from 'lucide-react';
import { BingoCard } from './BingoCard';

interface LobbyProps {
  currentRoomId: string | null;
  currentUserId: string;
  players: Record<string, Player>;
  isHost: boolean;
  winningPattern: WinningPattern;
  autoCall: boolean;
  callSpeed: number;
  onJoinOrCreateRoom: (
    roomId: string,
    playerInfo: {
      name: string;
      avatar: string;
      dauberColor: string;
      dauberSymbol: Player['dauberSymbol'];
    }
  ) => void;
  onStartGame: () => void;
  onToggleReady: (ready: boolean) => void;
  onChangeCard: (card: number[][]) => void;
  onUpdateSettings: (settings: {
    winningPattern?: WinningPattern;
    autoCall?: boolean;
    callSpeed?: number;
  }) => void;
  onQuickPlay: () => void;
}

const AVATARS = ['🎲', '🍀', '🦁', '🦄', '👑', '🚀', '🐱', '🦊', '⚡', '🍕'];
const DAUBER_COLORS = [
  { name: 'Ruby', hex: '#ef4444' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sapphire', hex: '#3b82f6' },
  { name: 'Gold', hex: '#f59e0b' },
  { name: 'Amethyst', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#ec4899' },
];
const STAMP_SYMBOLS: { id: Player['dauberSymbol']; label: string; icon: React.ReactNode }[] = [
  { id: 'dot', label: 'Dot', icon: <CircleDot className="w-4 h-4" /> },
  { id: 'star', label: 'Star', icon: <Star className="w-4 h-4" /> },
  { id: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
  { id: 'clover', label: 'Clover', icon: <Clover className="w-4 h-4" /> },
  { id: 'gem', label: 'Gem', icon: <Gem className="w-4 h-4" /> },
];

export const Lobby: React.FC<LobbyProps> = ({
  currentRoomId,
  currentUserId,
  players,
  isHost,
  winningPattern,
  autoCall,
  callSpeed,
  onJoinOrCreateRoom,
  onStartGame,
  onToggleReady,
  onChangeCard,
  onUpdateSettings,
  onQuickPlay,
}) => {
  // Check URL params for room code
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialRoom = urlParams?.get('room') || '';

  const [name, setName] = useState('Player ' + Math.floor(10 + Math.random() * 90));
  const [avatar, setAvatar] = useState('🎲');
  const [dauberColor, setDauberColor] = useState('#ef4444');
  const [dauberSymbol, setDauberSymbol] = useState<Player['dauberSymbol']>('dot');
  const [inputRoomCode, setInputRoomCode] = useState(initialRoom);

  const currentPlayer = currentUserId ? players[currentUserId] : null;

  const handleCreate = () => {
    // Random 4-letter room
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onJoinOrCreateRoom(code, { name, avatar, dauberColor, dauberSymbol });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    onJoinOrCreateRoom(inputRoomCode.trim(), { name, avatar, dauberColor, dauberSymbol });
  };

  // If already in a room in lobby state:
  if (currentRoomId && currentPlayer) {
    const playerList = Object.values(players);
    const allReady = playerList.length >= 1 && (playerList.length === 1 || playerList.filter((p) => !p.isHost).every((p) => p.isReady));

    return (
      <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        {/* Room Header Info */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Game Lobby
              </span>
              <span className="text-xs text-slate-400">
                Room Code: <strong className="text-amber-400 font-mono text-sm">{currentRoomId}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Waiting for Players to Ready Up</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Share this room code with 1 or more friends so they can join!
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isHost ? (
              <button
                onClick={onStartGame}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl shadow-xl transition flex items-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Start Game ({playerList.length} Players)</span>
              </button>
            ) : (
              <button
                onClick={() => onToggleReady(!currentPlayer.isReady)}
                className={`px-6 py-3 font-bold rounded-2xl shadow-xl transition flex items-center gap-2 text-sm sm:text-base cursor-pointer ${
                  currentPlayer.isReady
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{currentPlayer.isReady ? 'Ready! (Click to Unready)' : 'Ready Up'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 Column Layout: Host Game Settings & Joined Players vs Card Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Settings & Players */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Host Game Settings */}
            {isHost ? (
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Host Game Settings
                </h3>

                <div className="space-y-4">
                  {/* Winning Pattern */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Winning Pattern
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'line', name: 'Any Line', desc: 'Row, Column, or Diagonal' },
                        { id: 'corners', name: '4 Corners', desc: 'All four corner cells' },
                        { id: 'blackout', name: 'Blackout', desc: 'Full card 25 cells' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onUpdateSettings({ winningPattern: p.id as WinningPattern })}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            winningPattern === p.id
                              ? 'bg-indigo-600/30 border-indigo-500 text-white shadow'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="block font-bold text-xs">{p.name}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Call & Speed */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">Caller Mode</span>
                      <span className="text-[11px] text-slate-400">
                        {autoCall ? 'Automated ball timer' : 'Manual draw by host'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ autoCall: !autoCall })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          autoCall
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {autoCall ? 'Auto Call ON' : 'Manual Call'}
                      </button>

                      {autoCall && (
                        <select
                          value={callSpeed}
                          onChange={(e) => onUpdateSettings({ callSpeed: Number(e.target.value) })}
                          aria-label="Caller speed"
                          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer"
                        >
                          <option value={3}>Fast (3s)</option>
                          <option value={5}>Normal (5s)</option>
                          <option value={8}>Relaxed (8s)</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
                  Round Rules Set By Host
                </span>
                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/60 p-3 rounded-2xl">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pattern:</span>
                    <strong className="text-amber-400 capitalize">{winningPattern}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Caller:</span>
                    <strong className="text-slate-200">{autoCall ? `${callSpeed}s Auto` : 'Manual'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Joined Players */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Connected Members ({playerList.length})
                </h3>
                <span className="text-[11px] text-slate-400">Invite more via room code</span>
              </div>

              <div className="space-y-2">
                {playerList.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl p-1 bg-slate-700 rounded-full">{p.avatar}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 text-sm">{p.name}</span>
                          {p.id === currentUserId && (
                            <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-indigo-500/30 text-indigo-300 rounded border border-indigo-500/40">
                              You
                            </span>
                          )}
                          {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.dauberColor }}
                          />
                          <span className="text-[11px] text-slate-400 capitalize">{p.dauberSymbol} stamp</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {p.isReady ? (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-400">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Your Bingo Card Preview & Reroll */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 px-2">
              <span className="text-sm font-bold text-white">Your Card Preview</span>
              <button
                onClick={() => onChangeCard(generateBingoCard())}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Reroll Numbers</span>
              </button>
            </div>

            <BingoCard
              player={currentPlayer}
              calledNumbersSet={new Set()}
              winningPattern={winningPattern}
              gameStatus="lobby"
              onToggleMark={() => {}}
              onClaimBingo={() => {}}
              isCurrentUser={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // If not in a room yet: Landing Lobby
  return (
    <div className="max-w-2xl mx-auto p-4 my-4 flex flex-col gap-6">
      {/* Title Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Multiplayer B-I-N-G-O</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Play Live Bingo Together
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-lg mx-auto">
          Create a room for 2 or more members, invite friends with a 4-letter code, and compete in real-time with automated calling!
        </p>
      </div>

      {/* Profile & Customization Card */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5">
        {/* Name Input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
            Your Player Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={18}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-2xl text-white font-semibold text-sm outline-none transition"
          />
        </div>

        {/* Avatar Picker */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
            Choose Lucky Avatar
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setAvatar(av)}
                className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                  avatar === av
                    ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110 shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Dauber Color & Stamp Symbol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Dauber Ink Color
            </label>
            <div className="flex items-center gap-2">
              {DAUBER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setDauberColor(c.hex)}
                  className={`w-8 h-8 rounded-full transition-transform cursor-pointer border-2 ${
                    dauberColor === c.hex ? 'scale-125 border-white shadow-lg' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Dauber Stamp Shape
            </label>
            <div className="flex items-center gap-1.5">
              {STAMP_SYMBOLS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setDauberSymbol(s.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    dauberSymbol === s.id
                      ? 'bg-indigo-600/40 border-indigo-400 text-white shadow'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons: Create Room & Join with Code */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCreate}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create New Room</span>
          </button>

          <form onSubmit={handleJoin} className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
              placeholder="Room Code (e.g. 7A4B)"
              maxLength={6}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-2xl text-white font-mono uppercase font-bold text-center tracking-wider outline-none text-sm"
            />
            <button
              type="submit"
              className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-2xl transition cursor-pointer shrink-0"
            >
              Join
            </button>
          </form>
        </div>

        {/* Quick Demo Button for Instant Multi-Player test */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onQuickPlay}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 cursor-pointer"
          >
            ⚡ Quick Play Demo (Instant Room with 2 Players)
          </button>
        </div>
      </div>
    </div>
  );
};
