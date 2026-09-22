import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  BingoBall,
  ChatReaction,
  GameStatus,
  Player,
  RoomState,
  WinningPattern,
  WSClientMessage,
  WSServerMessage,
} from './src/types';
import {
  generateBingoCard,
  createInitialMarks,
  getBingoLetter,
  verifyWinAgainstCalledBalls,
  checkWin,
  calculateRemainingToWin,
} from './src/utils/bingo';

interface ServerRoom {
  id: string;
  status: GameStatus;
  hostId: string;
  winningPattern: WinningPattern;
  autoCall: boolean;
  callSpeed: number; // in seconds
  calledBalls: BingoBall[];
  calledNumbersSet: Set<number>;
  remainingBallsPool: number[];
  currentBall: BingoBall | null;
  players: Map<string, Player>;
  sockets: Map<string, WebSocket>;
  timer: NodeJS.Timeout | null;
  roundNumber: number;
  winner: RoomState['winner'];
  recentReactions: ChatReaction[];
  lastActive: number;
}

const rooms = new Map<string, ServerRoom>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function broadcastToRoom(room: ServerRoom, message: WSServerMessage) {
  const payload = JSON.stringify(message);
  for (const [playerId, socket] of room.sockets.entries()) {
    if (socket.readyState === WebSocket.OPEN) {
      // If room_state message, customize `yourId` for that specific client
      if (message.type === 'room_state') {
        const clientMsg: WSServerMessage = {
          type: 'room_state',
          state: message.state,
          yourId: playerId,
        };
        socket.send(JSON.stringify(clientMsg));
      } else {
        socket.send(payload);
      }
    }
  }
}

function sendToSocket(socket: WebSocket, message: WSServerMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function serializeRoomState(room: ServerRoom): RoomState {
  const playersObj: Record<string, Player> = {};
  for (const [id, player] of room.players.entries()) {
    playersObj[id] = player;
  }

  return {
    roomId: room.id,
    status: room.status,
    hostId: room.hostId,
    winningPattern: room.winningPattern,
    autoCall: room.autoCall,
    callSpeed: room.callSpeed,
    calledBalls: room.calledBalls,
    currentBall: room.currentBall,
    players: playersObj,
    winner: room.winner,
    recentReactions: room.recentReactions.slice(-10),
    roundNumber: room.roundNumber,
  };
}

function createNewBallPool(): number[] {
  const pool = Array.from({ length: 75 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function drawNextBall(room: ServerRoom): BingoBall | null {
  if (room.remainingBallsPool.length === 0) {
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
    room.status = 'ended';
    broadcastToRoom(room, {
      type: 'room_state',
      state: serializeRoomState(room),
      yourId: '',
    });
    return null;
  }

  const num = room.remainingBallsPool.pop()!;
  const ball: BingoBall = {
    number: num,
    letter: getBingoLetter(num),
    calledAt: Date.now(),
  };

  room.calledNumbersSet.add(num);
  room.calledBalls.push(ball);
  room.currentBall = ball;
  room.lastActive = Date.now();

  broadcastToRoom(room, {
    type: 'ball_called',
    ball,
    calledBalls: room.calledBalls,
  });

  return ball;
}

function startAutoCaller(room: ServerRoom) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  const intervalMs = Math.max(2500, room.callSpeed * 1000);
  room.timer = setInterval(() => {
    if (room.status === 'playing') {
      const drawn = drawNextBall(room);
      if (!drawn) {
        if (room.timer) {
          clearInterval(room.timer);
          room.timer = null;
        }
      }
    }
  }, intervalMs);
}

function stopCallerTimer(room: ServerRoom) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      time: new Date().toISOString(),
    });
  });

  // Create room endpoint
  app.post('/api/rooms/create', (req, res) => {
    let roomId = generateRoomId();
    while (rooms.has(roomId)) {
      roomId = generateRoomId();
    }
    res.json({ roomId });
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString()) as WSClientMessage;
        handleClientMessage(ws, msg);
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    function handleClientMessage(socket: WebSocket, msg: WSClientMessage) {
      if (msg.type === 'join_room') {
        const normalizedRoomId = msg.roomId.toUpperCase().trim();
        let room = rooms.get(normalizedRoomId);

        if (!room) {
          // Create room on the fly if it does not exist
          room = {
            id: normalizedRoomId,
            status: 'lobby',
            hostId: '',
            winningPattern: 'line',
            autoCall: true,
            callSpeed: 5,
            calledBalls: [],
            calledNumbersSet: new Set(),
            remainingBallsPool: createNewBallPool(),
            currentBall: null,
            players: new Map(),
            sockets: new Map(),
            timer: null,
            roundNumber: 1,
            winner: null,
            recentReactions: [],
            lastActive: Date.now(),
          };
          rooms.set(normalizedRoomId, room);
        }

        const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        currentRoomId = normalizedRoomId;
        currentPlayerId = playerId;

        const isFirst = room.players.size === 0 || !room.hostId;
        if (isFirst) {
          room.hostId = playerId;
        }

        const initialCard = generateBingoCard();
        const initialMarks = createInitialMarks();
        const remainingToWin = calculateRemainingToWin(initialMarks);

        const newPlayer: Player = {
          id: playerId,
          name: msg.player.name?.trim() || `Player ${room.players.size + 1}`,
          avatar: msg.player.avatar || '🎲',
          dauberColor: msg.player.dauberColor || '#ef4444',
          dauberSymbol: msg.player.dauberSymbol || 'dot',
          isHost: room.hostId === playerId,
          isReady: false,
          card: initialCard,
          marks: initialMarks,
          linesCompleted: 0,
          nearBingoCount: remainingToWin,
          joinedAt: Date.now(),
        };

        room.players.set(playerId, newPlayer);
        room.sockets.set(playerId, socket);
        room.lastActive = Date.now();

        // Send full state to newly joined player
        sendToSocket(socket, {
          type: 'room_state',
          state: serializeRoomState(room),
          yourId: playerId,
        });

        // Notify others
        broadcastToRoom(room, {
          type: 'player_joined',
          player: newPlayer,
        });
        return;
      }

      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const player = room.players.get(currentPlayerId);
      if (!player) return;

      switch (msg.type) {
        case 'set_ready': {
          player.isReady = msg.isReady;
          broadcastToRoom(room, {
            type: 'player_updated',
            player,
          });
          break;
        }

        case 'change_card': {
          if (room.status === 'lobby') {
            player.card = msg.card;
            player.marks = createInitialMarks();
            player.nearBingoCount = calculateRemainingToWin(player.marks);
            player.linesCompleted = 0;
            broadcastToRoom(room, {
              type: 'player_updated',
              player,
            });
          }
          break;
        }

        case 'update_settings': {
          if (player.id === room.hostId) {
            if (msg.winningPattern) room.winningPattern = msg.winningPattern;
            if (typeof msg.autoCall === 'boolean') room.autoCall = msg.autoCall;
            if (typeof msg.callSpeed === 'number') room.callSpeed = msg.callSpeed;

            broadcastToRoom(room, {
              type: 'room_state',
              state: serializeRoomState(room),
              yourId: '',
            });
          }
          break;
        }

        case 'start_game': {
          if (player.id !== room.hostId && room.players.size > 1) {
            // Only host can start game unless solo
            return;
          }

          if (msg.winningPattern) room.winningPattern = msg.winningPattern;
          if (typeof msg.autoCall === 'boolean') room.autoCall = msg.autoCall;
          if (typeof msg.callSpeed === 'number') room.callSpeed = msg.callSpeed;

          // Reset called balls
          room.calledBalls = [];
          room.calledNumbersSet.clear();
          room.remainingBallsPool = createNewBallPool();
          room.currentBall = null;
          room.winner = null;
          room.status = 'playing';

          // Reset all players marks
          for (const p of room.players.values()) {
            p.marks = createInitialMarks();
            p.linesCompleted = 0;
            p.nearBingoCount = calculateRemainingToWin(p.marks);
          }

          stopCallerTimer(room);

          broadcastToRoom(room, {
            type: 'game_started',
            state: serializeRoomState(room),
          });

          // Draw the very first ball after 1.5 seconds so players get ready
          setTimeout(() => {
            if (room.status === 'playing') {
              drawNextBall(room);
              if (room.autoCall) {
                startAutoCaller(room);
              }
            }
          }, 1500);

          break;
        }

        case 'pause_game': {
          if (player.id === room.hostId && room.status === 'playing') {
            room.status = 'paused';
            stopCallerTimer(room);
            broadcastToRoom(room, {
              type: 'game_paused',
            });
          }
          break;
        }

        case 'resume_game': {
          if (player.id === room.hostId && room.status === 'paused') {
            room.status = 'playing';
            if (room.autoCall) {
              startAutoCaller(room);
            }
            broadcastToRoom(room, {
              type: 'game_resumed',
            });
          }
          break;
        }

        case 'draw_ball': {
          if (player.id === room.hostId && (room.status === 'playing' || room.status === 'paused')) {
            drawNextBall(room);
          }
          break;
        }

        case 'mark_cell': {
          if (room.status !== 'playing' && room.status !== 'paused') return;
          const { row, col, marked } = msg;
          if (row === 2 && col === 2) return; // FREE is always marked

          player.marks[row][col] = marked;

          // Calculate completed lines and distance to win
          const winCheck = checkWin(player.marks, room.winningPattern);
          player.linesCompleted = winCheck.winningLines.length;
          player.nearBingoCount = calculateRemainingToWin(player.marks);

          broadcastToRoom(room, {
            type: 'player_updated',
            player,
          });
          break;
        }

        case 'claim_bingo': {
          if (room.status !== 'playing' && room.status !== 'paused') return;

          // Perform strict server-authoritative check!
          const verification = verifyWinAgainstCalledBalls(
            player.card,
            room.calledNumbersSet,
            room.winningPattern
          );

          if (verification.isValid) {
            stopCallerTimer(room);
            room.status = 'ended';
            room.winner = {
              playerId: player.id,
              playerName: player.name,
              winningLines: verification.winningLines.map((l) => ({
                type: l.type,
                index: l.index,
              })),
              pattern: room.winningPattern,
            };

            broadcastToRoom(room, {
              type: 'bingo_winner',
              winner: room.winner,
              state: serializeRoomState(room),
            });
          } else {
            // Invalid bingo claim
            sendToSocket(socket, {
              type: 'bingo_invalid',
              message: 'Not quite yet! Make sure all numbers in your winning line have actually been called.',
            });
          }
          break;
        }

        case 'send_reaction': {
          const reaction: ChatReaction = {
            id: 'r_' + Math.random().toString(36).substring(2, 9),
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar,
            playerColor: player.dauberColor,
            text: msg.text,
            emoji: msg.emoji,
            timestamp: Date.now(),
          };

          room.recentReactions.push(reaction);
          if (room.recentReactions.length > 20) {
            room.recentReactions.shift();
          }

          broadcastToRoom(room, {
            type: 'reaction',
            reaction,
          });
          break;
        }

        case 'reset_round': {
          stopCallerTimer(room);
          room.calledBalls = [];
          room.calledNumbersSet.clear();
          room.remainingBallsPool = createNewBallPool();
          room.currentBall = null;
          room.winner = null;
          room.status = 'lobby';
          room.roundNumber += 1;
          if (msg.newPattern) room.winningPattern = msg.newPattern;

          // Generate fresh cards for all players or let them keep
          for (const p of room.players.values()) {
            p.card = generateBingoCard();
            p.marks = createInitialMarks();
            p.linesCompleted = 0;
            p.nearBingoCount = calculateRemainingToWin(p.marks);
            p.isReady = false;
          }

          broadcastToRoom(room, {
            type: 'room_state',
            state: serializeRoomState(room),
            yourId: '',
          });
          break;
        }
      }
    }

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players.delete(currentPlayerId);
          room.sockets.delete(currentPlayerId);

          let newHostId: string | undefined;
          if (room.hostId === currentPlayerId && room.players.size > 0) {
            const nextHost = Array.from(room.players.values())[0];
            room.hostId = nextHost.id;
            nextHost.isHost = true;
            newHostId = nextHost.id;
          }

          if (room.players.size === 0) {
            stopCallerTimer(room);
            // Delete room if empty
            rooms.delete(currentRoomId);
          } else {
            broadcastToRoom(room, {
              type: 'player_left',
              playerId: currentPlayerId,
              newHostId,
            });
            broadcastToRoom(room, {
              type: 'room_state',
              state: serializeRoomState(room),
              yourId: '',
            });
          }
        }
      }
    });
  });

  // Periodically clean up abandoned rooms (> 2 hours old)
  setInterval(() => {
    const now = Date.now();
    for (const [id, r] of rooms.entries()) {
      if (r.players.size === 0 || now - r.lastActive > 2 * 60 * 60 * 1000) {
        stopCallerTimer(r);
        rooms.delete(id);
      }
    }
  }, 10 * 60 * 1000);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Bingo Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
