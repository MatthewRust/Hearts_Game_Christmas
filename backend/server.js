import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const db = new sqlite3.Database('./players.db');
db.run(`CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT,
  wins INTEGER DEFAULT 0
)`);

const connectedPlayers = new Map();
let gameInProgress = false;

function updateHost() {
  // Remove isHost from all
  for (const player of connectedPlayers.values()) {
    player.isHost = false;
  }
  // Assign host to first player (if any)
  const first = connectedPlayers.values().next().value;
  if (first) first.isHost = true;
}

function broadcastPlayers() {
  updateHost();
  io.emit('players:update', Array.from(connectedPlayers.values()));
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

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
    // If a game is already in progress, inform the requester
    if (gameInProgress) {
      socket.emit('game:start:error', { message: 'Game already in progress' });
      return;
    }

    const playerCount = connectedPlayers.size;
    if (playerCount < 2) {
      socket.emit('game:start:error', { message: 'Need at least 2 players to start the game' });
      return;
    }

    // Mark game as started and broadcast to all clients
    gameInProgress = true;
    const players = Array.from(connectedPlayers.values());
    io.emit('game:started', { players, startedAt: Date.now() });
  });

  // Allow ending the current game and resetting server-side game state
  socket.on('game:end', () => {
    if (!gameInProgress) {
      socket.emit('game:end:error', { message: 'No game in progress' });
      return;
    }

    // Reset game state on server
    gameInProgress = false;

    // Broadcast to all clients that the game has ended and server is reset
    io.emit('game:ended', { message: 'Game ended by request', resetAt: Date.now() });
  });
});

app.get('/', (req, res) => {
  res.send('Hearts backend running');
});

server.listen(3001, () => {
  console.log('Backend listening on port 3001');
});