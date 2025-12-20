import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SpitGameContext = createContext(null);

export const useSpitGame = () => {
  const context = useContext(SpitGameContext);
  if (!context) {
    throw new Error('useSpitGame must be used within SpitGameProvider');
  }
  return context;
};

export const SpitGameProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [waitingForOpponentSpit, setWaitingForOpponentSpit] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // Initialize socket connection to the /spit namespace (once)
  useEffect(() => {
    if (socketRef.current) return;

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    console.log('Initializing Spit socket connection to:', socketUrl + '/spit');

    const socket = io(socketUrl + '/spit', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      path: '/socket.io/',
      withCredentials: true,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ Spit socket connected:', socket.id);
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Spit socket disconnected. Reason:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Spit socket connection error:', err);
      setConnected(false);
      setError(`Connection failed: ${err.message}`);
    });

    // Spit game events
    socket.on('spit:playersUpdate', (updatedPlayers) => {
      console.log('Players updated:', updatedPlayers);
      setPlayers(updatedPlayers);
    });

    socket.on('spit:joinSuccess', (player) => {
      console.log('Join successful:', player);
      setJoined(true);
      setLoading(false);
    });

    socket.on('spit:gameStarted', (data) => {
      console.log('Game started:', data);
      setGameStarted(true);
      setGameOver(false);
      setWinner(null);
      setValidMoves([]);
      setWaitingForOpponentSpit(false);
      setLoading(false);
    });

    socket.on('spit:gameState', (state) => {
      console.log('Game state updated:', state);
      setGameState(state);
      if (state.gameOver) {
        setGameOver(true);
        setWinner(state.winner);
      }
    });

    socket.on('spit:gameOver', ({ winner: w, endedAt }) => {
      console.log('Game over. Winner:', w);
      setGameOver(true);
      setWinner(w);
      setGameStarted(false);
      addNotification(`Game Over! ${w} wins!`);
    });

    socket.on('spit:gameEnded', ({ message }) => {
      console.log('Game ended:', message);
      setGameStarted(false);
      setGameState(null);
      setGameOver(false);
      setWinner(null);
      setWaitingForOpponentSpit(false);
      addNotification(message || 'Game ended');
    });

    socket.on('spit:playerLeft', ({ name }) => {
      addNotification(`${name} has left the game`);
    });

    socket.on('spit:playError', ({ message }) => {
      setError(message);
      addNotification(message || 'Play error');
    });

    socket.on('spit:startError', ({ message }) => {
      setError(message);
      addNotification(message);
      setLoading(false);
    });

    socket.on('spit:validMoves', ({ moves }) => {
      console.log('Valid moves:', moves);
      setValidMoves(moves);
    });

    socket.on('spit:validMovesError', ({ message }) => {
      console.log('Valid moves error:', message);
      setValidMoves([]);
    });

    socket.on('spit:playerWaitingSpit', ({ playerName: waitingPlayer }) => {
      console.log(`${waitingPlayer} is waiting to spit`);
      if (waitingPlayer === playerName) {
        setWaitingForOpponentSpit(true);
        addNotification('Waiting for opponent to spit...');
      } else {
        addNotification(`${waitingPlayer} wants to spit!`);
      }
    });

    socket.on('spit:spitExecuted', ({ message }) => {
      console.log('Spit executed:', message);
      setWaitingForOpponentSpit(false);
      addNotification('Spit! New cards dealt to center.');
    });

    socket.on('spit:spitError', ({ message }) => {
      console.log('Spit error:', message);
      setError(message);
      setWaitingForOpponentSpit(false);
      addNotification(message || 'Spit error');
    });

    socket.on('spit:roundEnd', ({ eliminated, newRound }) => {
      console.log(`Round ended: ${eliminated} eliminated. Starting round ${newRound}`);
      setCurrentRound(newRound);
      addNotification(`${eliminated} is out! Round ${newRound} starting...`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const addNotification = useCallback((text) => {
    const id = `${Date.now()}`;
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      5000
    );
  }, []);

  const joinGame = useCallback((name) => {
    if (!name || !name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (!socketRef.current?.connected) {
      setError('Not connected to server. Please wait...');
      return;
    }
    console.log('Emitting spit:join for:', name.trim());
    setLoading(true);
    setError(null);
    setPlayerName(name.trim());
    socketRef.current.emit('spit:join', { name: name.trim() });
  }, []);

  const startGame = useCallback(() => {
    setLoading(true);
    setError(null);
    socketRef.current?.emit('spit:start');
  }, []);

  const playCard = useCallback(
    (spitPileIndex, centerPileIndex) => {
      if (!playerName) return;
      socketRef.current?.emit('spit:playCard', {
        playerName,
        spitPileIndex,
        centerPileIndex,
      });
    },
    [playerName]
  );

  const requestSpit = useCallback(() => {
    if (!playerName) return;
    socketRef.current?.emit('spit:requestSpit', { playerName });
  }, [playerName]);

  const getValidMoves = useCallback(() => {
    if (!playerName) return;
    socketRef.current?.emit('spit:getValidMoves', { playerName });
  }, [playerName]);

  const endGame = useCallback(() => {
    socketRef.current?.emit('spit:end');
  }, []);

  const value = {
    playerName,
    joined,
    players,
    gameStarted,
    gameState,
    notifications,
    loading,
    error,
    connected,
    gameOver,
    winner,
    validMoves,
    waitingForOpponentSpit,
    currentRound,
    joinGame,
    startGame,
    playCard,
    requestSpit,
    getValidMoves,
    endGame,
    addNotification,
  };

  return (
    <SpitGameContext.Provider value={value}>{children}</SpitGameContext.Provider>
  );
};
