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

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
  socket.on('join', ({ name }) => {
  console.log(`${name} joined the game`);
  // TODO: Add player to game state
});

});

app.get('/', (req, res) => {
  res.send('Hearts backend running');
});

server.listen(3001, () => {
  console.log('Backend listening on port 3001');
});