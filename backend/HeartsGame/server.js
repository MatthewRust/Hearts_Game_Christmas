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
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
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
let passSelections = new Map();
let awaitingPass = false;

function updateHost() {
  // gets rid of the host from all the users
  for (const player of connectedPlayers.values()) {
    player.isHost = false;
  }
  // gives the host duties to the next person
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

function emitHands() {
  if (!heartGame) return;
  const players = Array.from(connectedPlayers.values());
  players.forEach((player) => {
    const hand = heartGame.players[player.name]?.cards || [];
    io.to(player.id).emit('game:hand', { hand });
  });
}

function startPassPhase({ initialStart = false } = {}) {
  if (!heartGame) return;
  passSelections = new Map();
  const distance = heartGame.getPassDistance();
  awaitingPass = distance > 0;
  const players = Array.from(connectedPlayers.values());

  // Send current hands so players can choose cards to pass
  emitHands();

  if (awaitingPass) {
    players.forEach((player) => {
      const target = heartGame.getPassTarget(player.name, distance);
      io.to(player.id).emit('game:passPending', {
        round: heartGame.round,
        distance,
        target,
      });
    });
    if (initialStart) {
      io.emit('game:started', { players, startedAt: Date.now(), passPending: true });
    } else {
      io.emit('game:roundPassPending', { round: heartGame.round, distance });
    }
  } else {
    finalizeRoundStart({ initialStart });
  }
}

function finalizeRoundStart({ initialStart = false } = {}) {
  awaitingPass = false;
  if (!heartGame) return;
  heartGame.setInitialLeader(); // recalc after any passes
  heartGame.sortHands();
  emitHands();
  io.emit('game:state', {
    turn: heartGame.getCurrentPlayer(),
    pile: heartGame.pile.cards,
    scores: heartGame.scores,
    totalScores: heartGame.totalScores,
    round: heartGame.round,
  });
  if (initialStart) {
    const players = Array.from(connectedPlayers.values());
    io.emit('game:started', { players, startedAt: Date.now(), passPending: false });
  } else {
    io.emit('game:roundStarted', { round: heartGame.round });
  }
}

function tryResolvePasses() {
  if (!awaitingPass || !heartGame) return;
  if (passSelections.size !== connectedPlayers.size) return; // wait for everyone

  heartGame.applyPasses(Object.fromEntries(passSelections));
  heartGame.setInitialLeader();
  heartGame.sortHands();
  passSelections.clear();
  awaitingPass = false;

  emitHands();
  io.emit('game:passComplete', { round: heartGame.round });
  io.emit('game:state', {
    turn: heartGame.getCurrentPlayer(),
    pile: heartGame.pile.cards,
    scores: heartGame.scores,
    totalScores: heartGame.totalScores,
    round: heartGame.round,
  });
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  console.log('Transport:', socket.conn.transport.name);

  //handles a player disconnecting
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const player = connectedPlayers.get(socket.id);
    connectedPlayers.delete(socket.id);
    broadcastPlayers();

    //send notification to the users of who left
    if (player) {
      io.emit('player:left', { playerId: player.id, name: player.name });
    } else {
      //if we dont know who left we just send out the sockets id
      io.emit('player:left', { playerId: socket.id });
    }
  });

  socket.on('join', ({ name }) => {
    console.log(`${name} joined the game`);
    const player = { id: socket.id, name };
    connectedPlayers.set(socket.id, player);
    broadcastPlayers();
    
    //emits the success flag to the players  when joining
    socket.emit('join:success', player);
  });

  //starts the game

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
    //starts the backend stuff up
    const playerNames = Array.from(connectedPlayers.values()).map(p => p.name);
    heartGame = new HeartGame(playerNames);
    heartGame.setUpDeck();
    heartGame.dealAllCards();
    heartGame.setInitialLeader();
    gameInProgress = true;
    startPassPhase({ initialStart: true });
  });


  //a player plays a card down
  socket.on('game:playCard', ({ playerName, card }) => {
    if (!gameInProgress || !heartGame) {
      socket.emit('game:play:error', { message: 'No game in progress' });
      return;
    }
    if (awaitingPass) {
      socket.emit('game:play:error', { message: 'Complete passing before playing' });
      return;
    }
    try {
      const result = heartGame.playCard(playerName, card, { deferResolve: true });
      //updates all the hands
      for (const [id, player] of connectedPlayers.entries()) {
        const hand = heartGame.players[player.name]?.cards || [];
        io.to(id).emit('game:hand', { hand });
      }
      //sends out the new game state to all the playes (pile still visible if trick just completed)
      io.emit('game:state', {
        turn: heartGame.getCurrentPlayer(),
        pile: heartGame.pile.cards,
        scores: heartGame.scores,
        totalScores: heartGame.totalScores,
        round: heartGame.round,
      });

      if (result.trickComplete) {
        setTimeout(() => {
          heartGame.resolveTrick();
          io.emit('game:trickResolved', {
            scores: heartGame.scores,
            turn: heartGame.getCurrentPlayer(),
          });

          if (heartGame.isRoundOver()) {
            const roundSummary = heartGame.finishRound();
            io.emit('game:roundEnd', roundSummary);

            if (heartGame.hasMoreRounds()) {
              heartGame.startNewRound();
              startPassPhase({ initialStart: false });
            } else {
              io.emit('game:over', { standings: roundSummary.standings, endedAt: Date.now(), totalScores: heartGame.totalScores });
              gameInProgress = false;
              heartGame = null;
            }
          } else {
            // send fresh state for next trick (now with cleared pile)
            io.emit('game:state', {
              turn: heartGame.getCurrentPlayer(),
              pile: heartGame.pile.cards,
              scores: heartGame.scores,
              totalScores: heartGame.totalScores,
              round: heartGame.round,
            });
          }
        }, 1200); // 1.2s delay to let players see the last card
      }
    } catch (err) {
      socket.emit('game:play:error', { message: err.message });
    }
  });
  //end game stuff
  socket.on('game:end', () => {
    if (!gameInProgress) {
      socket.emit('game:end:error', { message: 'No game in progress' });
      return;
    }
    //restest the game severs
    gameInProgress = false;
    heartGame = null;
    passSelections.clear();
    awaitingPass = false;
    //sends out that the game has been ended
    io.emit('game:ended', { message: 'Game ended by request', resetAt: Date.now() });
  });

  socket.on('game:selectPass', ({ playerName, cards }) => {
    if (!gameInProgress || !heartGame) {
      socket.emit('game:pass:error', { message: 'No game in progress' });
      return;
    }
    if (!awaitingPass) {
      socket.emit('game:pass:error', { message: 'No passing required this round' });
      return;
    }
    if (!Array.isArray(cards) || cards.length !== 2) {
      socket.emit('game:pass:error', { message: 'Select exactly 2 cards to pass' });
      return;
    }
    const hand = heartGame.players[playerName];
    if (!hand) {
      socket.emit('game:pass:error', { message: 'Unknown player' });
      return;
    }

    // allow re-selection: return previous cards to hand
    const previous = passSelections.get(playerName);
    if (previous) {
      previous.forEach((c) => hand.addCard(c));
    }

    const chosen = [];
    const seen = new Set();
    for (const c of cards) {
      const key = `${c.suit}-${c.rank}`;
      if (seen.has(key)) {
        socket.emit('game:pass:error', { message: 'Cards must be unique' });
        return;
      }
      seen.add(key);
      const match = hand.cards.find(card => card.suit === c.suit && card.rank === c.rank);
      if (!match) {
        socket.emit('game:pass:error', { message: 'Card not in hand' });
        return;
      }
      chosen.push(match);
    }

    // remove chosen cards from hand
    chosen.forEach((c) => hand.removeCard(c));
    passSelections.set(playerName, chosen);
    heartGame.sortHands();

    socket.emit('game:passAccepted', { round: heartGame.round, hand: hand.cards });
    tryResolvePasses();
  });
});

app.get('/', (req, res) => {
  res.send('Hearts backend running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on 0.0.0.0:${PORT}`);
  console.log('Socket.IO ready for connections');
});