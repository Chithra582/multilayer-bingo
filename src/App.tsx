import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatReaction,
  Player,
  RoomState,
  WinningPattern,
  WSClientMessage,
  WSServerMessage,
} from './types';
import {
  isSoundMuted,
  setSoundMuted,
  isVoiceCallingEnabled,
  setVoiceEnabled,
  playBallDropSound,
  speakBall,
} from './utils/audio';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { BingoCard } from './components/BingoCard';
import { BallCaller } from './components/BallCaller';
import { PlayerList } from './components/PlayerList';
import { MasterBoard } from './components/MasterBoard';
import { ReactionsBar } from './components/ReactionsBar';
import { BingoModal } from './components/BingoModal';
import { DualPlayerMode } from './components/DualPlayerMode';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMutedState] = useState<boolean>(() => isSoundMuted());
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(() => isVoiceCallingEnabled());
  const [invalidNotice, setInvalidNotice] = useState<string | null>(null);
  const [isDualMode, setIsDualMode] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const pendingJoinRef = useRef<{
    roomId: string;
    player: { name: string; avatar: string; dauberColor: string; dauberSymbol: Player['dauberSymbol'] };
  } | null>(null);

  // Initialize and maintain WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // If there is a pending join request (e.g. from joining a room), send it immediately
      if (pendingJoinRef.current) {
        ws.send(
          JSON.stringify({
            type: 'join_room',
            roomId: pendingJoinRef.current.roomId,
            player: pendingJoinRef.current.player,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSServerMessage;
        handleServerMessage(msg);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after delay
      setTimeout(() => {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 2000);
    };

    ws.onerror = (err) => {
      console.warn('WS error:', err);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendWsMessage = useCallback((msg: WSClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('WebSocket not open. ReadyState:', socketRef.current?.readyState);
    }
  }, []);

  const handleServerMessage = (msg: WSServerMessage) => {
    switch (msg.type) {
      case 'room_state': {
        setRoomState(msg.state);
        setRoomId(msg.state.roomId);
        if (msg.yourId) {
          setMyPlayerId(msg.yourId);
        }
        break;
      }

      case 'ball_called': {
        playBallDropSound();
        speakBall(msg.ball);
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentBall: msg.ball,
            calledBalls: msg.calledBalls,
          };
        });
        break;
      }

      case 'player_joined': {
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: {
              ...prev.players,
              [msg.player.id]: msg.player,
            },
          };
        });
        break;
      }

      case 'player_left': {
        setRoomState((prev) => {
          if (!prev) return prev;
          const nextPlayers = { ...prev.players };
          delete nextPlayers[msg.playerId];
          return {
            ...prev,
            players: nextPlayers,
            hostId: msg.newHostId || prev.hostId,
          };
        });
        break;
      }

      case 'player_updated': {
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: {
              ...prev.players,
              [msg.player.id]: msg.player,
            },
          };
        });
        break;
      }

      case 'game_started': {
        setRoomState(msg.state);
        break;
      }

      case 'game_paused': {
        setRoomState((prev) => (prev ? { ...prev, status: 'paused' } : prev));
        break;
      }

      case 'game_resumed': {
        setRoomState((prev) => (prev ? { ...prev, status: 'playing' } : prev));
        break;
      }

      case 'reaction': {
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentReactions: [...prev.recentReactions, msg.reaction].slice(-15),
          };
        });
        break;
      }

      case 'bingo_winner': {
        setRoomState((prev) => {
          if (!prev) return msg.state;
          return {
            ...msg.state,
            winner: msg.winner,
          };
        });
        break;
      }

      case 'bingo_invalid': {
        setInvalidNotice(msg.message);
        break;
      }
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMutedState(next);
    setSoundMuted(next);
  };

  const handleToggleVoice = () => {
    const next = !isVoiceActive;
    setIsVoiceActive(next);
    setVoiceEnabled(next);
  };

  const handleJoinOrCreateRoom = (
    targetRoomId: string,
    playerInfo: {
      name: string;
      avatar: string;
      dauberColor: string;
      dauberSymbol: Player['dauberSymbol'];
    }
  ) => {
    pendingJoinRef.current = {
      roomId: targetRoomId.toUpperCase().trim(),
      player: playerInfo,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'join_room',
          roomId: targetRoomId.toUpperCase().trim(),
          player: playerInfo,
        })
      );
    } else {
      connectWebSocket();
    }
  };

  const handleQuickPlay = () => {
    const randomCode = 'PLAY' + Math.floor(10 + Math.random() * 90);
    handleJoinOrCreateRoom(randomCode, {
      name: 'Player ' + Math.floor(10 + Math.random() * 90),
      avatar: '🍀',
      dauberColor: '#ef4444',
      dauberSymbol: 'star',
    });
  };

  const handleStartGame = () => {
    sendWsMessage({ type: 'start_game' });
  };

  const handlePauseGame = () => {
    sendWsMessage({ type: 'pause_game' });
  };

  const handleResumeGame = () => {
    sendWsMessage({ type: 'resume_game' });
  };

  const handleDrawBall = () => {
    sendWsMessage({ type: 'draw_ball' });
  };

  const handleToggleReady = (isReady: boolean) => {
    sendWsMessage({ type: 'set_ready', isReady });
  };

  const handleChangeCard = (card: number[][]) => {
    sendWsMessage({ type: 'change_card', card });
  };

  const handleUpdateSettings = (settings: {
    winningPattern?: WinningPattern;
    autoCall?: boolean;
    callSpeed?: number;
  }) => {
    sendWsMessage({ type: 'update_settings', ...settings });
  };

  const handleToggleMark = (row: number, col: number) => {
    if (!roomState || !myPlayerId) return;
    const player = roomState.players[myPlayerId];
    if (!player) return;

    const currentlyMarked = player.marks[row][col];
    sendWsMessage({
      type: 'mark_cell',
      row,
      col,
      marked: !currentlyMarked,
    });
  };

  const handleClaimBingo = () => {
    sendWsMessage({ type: 'claim_bingo' });
  };

  const handleSendReaction = (emoji?: string, text?: string) => {
    sendWsMessage({
      type: 'send_reaction',
      emoji,
      text,
    });
  };

  const handleNewRound = (newPattern?: WinningPattern) => {
    sendWsMessage({
      type: 'reset_round',
      newPattern,
    });
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setRoomState(null);
    pendingJoinRef.current = null;
    if (socketRef.current) {
      socketRef.current.close();
      connectWebSocket();
    }
  };

  // Extract variables
  const currentPlayer = roomState && myPlayerId ? roomState.players[myPlayerId] : null;
  const isHost = Boolean(roomState && myPlayerId && roomState.hostId === myPlayerId);
  const calledNumbersSet = new Set(roomState?.calledBalls.map((b) => b.number) || []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        roomId={roomId}
        isConnected={isConnected}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onLeaveRoom={roomId ? handleLeaveRoom : undefined}
        onToggleDualMode={() => setIsDualMode(!isDualMode)}
        isDualMode={isDualMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isDualMode ? (
          <DualPlayerMode onExit={() => setIsDualMode(false)} />
        ) : !roomId || !roomState || roomState.status === 'lobby' ? (
          <Lobby
            currentRoomId={roomId}
            currentUserId={myPlayerId}
            players={roomState?.players || {}}
            isHost={isHost}
            winningPattern={roomState?.winningPattern || 'line'}
            autoCall={roomState?.autoCall ?? true}
            callSpeed={roomState?.callSpeed || 5}
            onJoinOrCreateRoom={handleJoinOrCreateRoom}
            onStartGame={handleStartGame}
            onToggleReady={handleToggleReady}
            onChangeCard={handleChangeCard}
            onUpdateSettings={handleUpdateSettings}
            onQuickPlay={handleQuickPlay}
          />
        ) : (
          /* Live Active Game Layout */
          <div className="max-w-7xl mx-auto p-3 sm:p-6 flex flex-col gap-6">
            {/* Top Grid: Caller Centerpiece & Players Live List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (Desktop 7 Cols): Ball Caller & Master Board */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <BallCaller
                  currentBall={roomState.currentBall}
                  calledBalls={roomState.calledBalls}
                  gameStatus={roomState.status}
                  isHost={isHost}
                  autoCall={roomState.autoCall}
                  callSpeed={roomState.callSpeed}
                  onDrawBall={handleDrawBall}
                  onPauseGame={handlePauseGame}
                  onResumeGame={handleResumeGame}
                  onChangeSpeed={(speed) => handleUpdateSettings({ callSpeed: speed })}
                  isVoiceActive={isVoiceActive}
                  onToggleVoice={handleToggleVoice}
                />

                {/* Master Board (1-75) */}
                <MasterBoard
                  calledNumbersSet={calledNumbersSet}
                  lastCalledNumber={roomState.currentBall?.number}
                />

                {/* Live Member Roster (shown below caller on desktop or on mobile) */}
                <PlayerList
                  players={roomState.players}
                  currentUserId={myPlayerId}
                  hostId={roomState.hostId}
                  gameStatus={roomState.status}
                  winningPattern={roomState.winningPattern}
                />
              </div>

              {/* Right Column (Desktop 5 Cols): Player's Interactive Bingo Card */}
              <div className="lg:col-span-5 flex flex-col items-center">
                {currentPlayer && (
                  <BingoCard
                    player={currentPlayer}
                    calledNumbersSet={calledNumbersSet}
                    winningPattern={roomState.winningPattern}
                    gameStatus={roomState.status}
                    onToggleMark={handleToggleMark}
                    onClaimBingo={handleClaimBingo}
                    isCurrentUser={true}
                  />
                )}
              </div>
            </div>

            {/* Bottom Interactive Reactions & Banter */}
            <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40">
              <ReactionsBar
                onSendReaction={handleSendReaction}
                reactions={roomState.recentReactions}
              />
            </div>

            {/* Winner / Invalid Claim Modal */}
            <BingoModal
              winner={roomState.winner}
              currentUserId={myPlayerId}
              isHost={isHost}
              onNewRound={handleNewRound}
              invalidNotice={invalidNotice}
              onDismissInvalidNotice={() => setInvalidNotice(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
