import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import HeartGame from './heartGame.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  }
});

console.log('Socket.IO server initialized with CORS: *');

const db = new sqlite3.Database('./players.db');
db.run(`CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT,
  wins INTEGER DEFAULT 0
)`);

const connectedPlayers = new Map();

let gameInProgress = false;
let heartGame = null;

function updateHost() {
  // Remove isHost from all
  for (const player of connectedPlayers.values()) {
    player.isHost = false;
  }
  // Assign host to first player (if any)
  const first = connectedPlayers.values().next().value;
  if (first) {
    first.isHost = true;
    io.emit('player:host', { playerId: first.id });
  }
}

function broadcastPlayers() {
  updateHost();
  io.emit('players:update', Array.from(connectedPlayers.values()));
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  console.log('Transport:', socket.conn.transport.name);

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    // Grab the player info before removing from the map
    const player = connectedPlayers.get(socket.id);
    connectedPlayers.delete(socket.id);

    // Broadcast updated player list
    broadcastPlayers();

    // Inform clients which player left (include id and name if available)
    if (player) {
      io.emit('player:left', { playerId: player.id, name: player.name });
    } else {
      // Fallback: emit only id if we didn't have the player record
      io.emit('player:left', { playerId: socket.id });
    }
  });

  socket.on('join', ({ name }) => {
    console.log(`${name} joined the game`);
    const player = { id: socket.id, name };
    connectedPlayers.set(socket.id, player);
    broadcastPlayers();
    
    // Send join confirmation to the new player
    socket.emit('join:success', player);
  });

  // Allow any client to request starting the game; server validates conditions

  socket.on('game:start', () => {
    if (gameInProgress) {
      socket.emit('game:start:error', { message: 'Game already in progress' });
      return;
    }
    const playerCount = connectedPlayers.size;
    if (playerCount < 2) {
      socket.emit('game:start:error', { message: 'Need at least 2 players to start the game' });
      return;
    }
    // Start backend game logic
    const playerNames = Array.from(connectedPlayers.values()).map(p => p.name);
    heartGame = new HeartGame(playerNames);
  heartGame.setUpDeck();
  heartGame.dealAllCards();
  heartGame.setInitialLeader();
    gameInProgress = true;
    const players = Array.from(connectedPlayers.values());
    // Send initial hands and game state to each player
    players.forEach((player) => {
      const hand = heartGame.players[player.name]?.cards || [];
      io.to(player.id).emit('game:hand', { hand });
    });
    io.emit('game:state', {
      turn: heartGame.getCurrentPlayer(),
      pile: heartGame.pile.cards,
      scores: heartGame.scores,
      totalScores: heartGame.totalScores,
      round: heartGame.round,
    });
    io.emit('game:started', { players, startedAt: Date.now() });
  });


  // Player plays a card
  socket.on('game:playCard', ({ playerName, card }) => {
    if (!gameInProgress || !heartGame) {
      socket.emit('game:play:error', { message: 'No game in progress' });
      return;
    }
    try {
      heartGame.playCard(playerName, card);
      // Update all hands (send only to each player)
      for (const [id, player] of connectedPlayers.entries()) {
        const hand = heartGame.players[player.name]?.cards || [];
        io.to(id).emit('game:hand', { hand });
      }
      // Broadcast updated game state
      io.emit('game:state', {
        turn: heartGame.getCurrentPlayer(),
        pile: heartGame.pile.cards,
        scores: heartGame.scores,
        totalScores: heartGame.totalScores,
        round: heartGame.round,
      });
      // If trick resolved, broadcast winner and reset pile
      if (heartGame.pile.cards.length === 0) {
        io.emit('game:trickResolved', {
          scores: heartGame.scores,
          turn: heartGame.getCurrentPlayer(),
        });
        // If round is over, broadcast round end

        if (heartGame.isRoundOver()) {
          const roundSummary = heartGame.finishRound();
          io.emit('game:roundEnd', roundSummary);

          if (heartGame.hasMoreRounds()) {
            heartGame.startNewRound();
            const players = Array.from(connectedPlayers.values());
            players.forEach((player) => {
              const hand = heartGame.players[player.name]?.cards || [];
              io.to(player.id).emit('game:hand', { hand });
            });
            io.emit('game:state', {
              turn: heartGame.getCurrentPlayer(),
              pile: heartGame.pile.cards,
              scores: heartGame.scores,
              totalScores: heartGame.totalScores,
              round: heartGame.round,
            });
          } else {
            io.emit('game:over', { standings: roundSummary.standings, endedAt: Date.now(), totalScores: heartGame.totalScores });
            gameInProgress = false;
            heartGame = null;
          }
        }
      }
    } catch (err) {
      socket.emit('game:play:error', { message: err.message });
    }
  });

  // Allow ending the current game and resetting server-side game state
  socket.on('game:end', () => {
    if (!gameInProgress) {
      socket.emit('game:end:error', { message: 'No game in progress' });
      return;
    }
    // Reset game state on server
    gameInProgress = false;
    heartGame = null;
    // Broadcast to all clients that the game has ended and server is reset
    io.emit('game:ended', { message: 'Game ended by request', resetAt: Date.now() });
  });
});

app.get('/', (req, res) => {
  res.send('Hearts backend running');
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Backend listening on 0.0.0.0:3001');
  console.log('Socket.IO ready for connections');
});