import SpitGame from './spitGame.js';

export function initSpitServer(io) {
  // Use a separate namespace for Spit to avoid conflicts with Hearts
  const spit = io.of('/spit');
  
  const connectedPlayers = new Map(); // socket.id -> { id, name }
  let gameInProgress = false;
  let spitGame = null;
  let spitRequests = new Set(); // Track players who have requested spit

  spit.on('connection', (socket) => {
    console.log('Player connected to Spit:', socket.id);

    // Player disconnects
    socket.on('disconnect', () => {
      console.log('Player disconnected from Spit:', socket.id);
      const player = connectedPlayers.get(socket.id);
      connectedPlayers.delete(socket.id);
      broadcastPlayers();

      if (player) {
        spit.emit('spit:playerLeft', { playerId: player.id, name: player.name });
      }

      // End game if it was in progress
      if (gameInProgress && connectedPlayers.size < 2) {
        gameInProgress = false;
        spitGame = null;
        spit.emit('spit:gameEnded', { message: 'Game ended: opponent disconnected' });
      }
    });

    // Player joins
    socket.on('spit:join', ({ name }) => {
      console.log(`${name} joined Spit game`);
      const player = { id: socket.id, name };
      connectedPlayers.set(socket.id, player);
      broadcastPlayers();
      socket.emit('spit:joinSuccess', player);
    });

    // Start the game
    socket.on('spit:start', () => {
      if (gameInProgress) {
        socket.emit('spit:startError', { message: 'Game already in progress' });
        return;
      }

      const playerCount = connectedPlayers.size;
      if (playerCount !== 2) {
        socket.emit('spit:startError', { message: 'Need exactly 2 players to start Spit' });
        return;
      }

      try {
        const playerNames = Array.from(connectedPlayers.values()).map(p => p.name);
        spitGame = new SpitGame(playerNames[0], playerNames[1]);
        spitGame.setupGame();
        gameInProgress = true;
        spitRequests.clear();

        // Broadcast initial game state
        spit.emit('spit:gameStarted', {
          player1: playerNames[0],
          player2: playerNames[1],
          startedAt: Date.now(),
        });

        broadcastGameState();
      } catch (err) {
        socket.emit('spit:startError', { message: err.message });
      }
    });

    // Player plays a card
    socket.on('spit:playCard', ({ playerName, spitPileIndex, centerPileIndex }) => {
      if (!gameInProgress || !spitGame) {
        socket.emit('spit:playError', { message: 'No game in progress' });
        return;
      }

      // Cannot play if this player has already requested spit
      if (spitRequests.has(playerName)) {
        socket.emit('spit:playError', { message: 'Waiting for opponent to spit' });
        return;
      }

      try {
        const result = spitGame.playCard(playerName, spitPileIndex, centerPileIndex);

        // Broadcast updated game state to all players
        broadcastGameState();

        // Check if round ended
        if (result.roundEnd) {
          const roundEndResult = spitGame.endRound(result.roundEnd.eliminated);

          if (roundEndResult.gameOver) {
            // Game is over
            spit.emit('spit:gameOver', {
              winner: roundEndResult.winner,
              endedAt: Date.now(),
            });
            gameInProgress = false;
            spitGame = null;
          } else {
            // New round starting
            spit.emit('spit:roundEnd', {
              eliminated: result.roundEnd.eliminated,
              newRound: roundEndResult.newRound,
            });
            broadcastGameState();
          }
        }
      } catch (err) {
        socket.emit('spit:playError', { message: err.message });
      }
    });

    // Handle spit request
    socket.on('spit:requestSpit', ({ playerName }) => {
      if (!gameInProgress || !spitGame) {
        socket.emit('spit:spitError', { message: 'No game in progress' });
        return;
      }

      // Add player to spit requests
      spitRequests.add(playerName);

      // Broadcast that this player is waiting to spit
      spit.emit('spit:playerWaitingSpit', { playerName });

      // Check if both players have requested spit
      const playerNames = [spitGame.player1Name, spitGame.player2Name];
      if (playerNames.every(name => spitRequests.has(name))) {
        try {
          // Both players have requested spit - flip cards from stock to center
          spitGame.executeSpit();

          // Clear spit requests
          spitRequests.clear();

          // Broadcast that spit has been executed
          spit.emit('spit:spitExecuted', { message: 'New cards dealt to center' });

          // Check if either player is out of cards
          if (spitGame.players[spitGame.player1Name].handSize === 0) {
            spitGame.gameOver = true;
            spitGame.winner = spitGame.player1Name;
          } else if (spitGame.players[spitGame.player2Name].handSize === 0) {
            spitGame.gameOver = true;
            spitGame.winner = spitGame.player2Name;
          }

          // Broadcast updated game state
          broadcastGameState();

          if (spitGame.gameOver) {
            spit.emit('spit:gameOver', {
              winner: spitGame.winner,
              endedAt: Date.now(),
            });
            gameInProgress = false;
            spitGame = null;
          }
        } catch (err) {
          socket.emit('spit:spitError', { message: err.message });
          spitRequests.clear();
        }
      }
    });

    // End game
    socket.on('spit:end', () => {
      if (!gameInProgress) {
        socket.emit('spit:endError', { message: 'No game in progress' });
        return;
      }

      gameInProgress = false;
      spitGame = null;
      spitRequests.clear();
      spit.emit('spit:gameEnded', {
        message: 'Game ended by player request',
        resetAt: Date.now(),
      });
    });

    // Request valid moves (for UI)
    socket.on('spit:getValidMoves', ({ playerName }) => {
      if (!gameInProgress || !spitGame) {
        socket.emit('spit:validMovesError', { message: 'No game in progress' });
        return;
      }

      try {
        const moves = spitGame.getValidMoves(playerName);
        socket.emit('spit:validMoves', { moves });
      } catch (err) {
        socket.emit('spit:validMovesError', { message: err.message });
      }
    });
  });

  /**
   * Broadcast updated player list
   */
  function broadcastPlayers() {
    const players = Array.from(connectedPlayers.values());
    spit.emit('spit:playersUpdate', players);
  }

  /**
   * Broadcast current game state to all connected clients
   */
  function broadcastGameState() {
    if (!spitGame) return;

    const gameState = spitGame.getGameState();
    spit.emit('spit:gameState', gameState);
  }
}
