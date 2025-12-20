import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const { socket, connected: isConnected } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameInfo, setGameInfo] = useState(null);
  const [hand, setHand] = useState([]);
  const [turn, setTurn] = useState(null);
  const [pile, setPile] = useState([]);
  const [scores, setScores] = useState({});
  const [totals, setTotals] = useState({});
  const [round, setRound] = useState(1);
  const [standings, setStandings] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [lastRoundSummary, setLastRoundSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passPending, setPassPending] = useState(false);
  const [passInfo, setPassInfo] = useState(null);
  const [passSubmitted, setPassSubmitted] = useState(false);

  // Set up Hearts game event listeners
  useEffect(() => {
    if (!socket) return;

    // Game event handlers
    socket.on('players:update', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('join:success', () => {
      setJoined(true);
      setLoading(false);
    });

    socket.on('game:started', (data) => {
      setGameInfo(data);
      setGameStarted(!data?.passPending);
      setPassPending(Boolean(data?.passPending));
      setPassSubmitted(false);
      setPassInfo(null);
      setGameOver(false);
      setStandings(null);
      setPile([]);
      setScores({});
      setTotals({});
      setLastRoundSummary(null);
      setLoading(false);
    });

    socket.on('game:ended', ({ message }) => {
      setGameStarted(false);
      setGameInfo(null);
      setHand([]);
      setPile([]);
      setScores({});
      setStandings(null);
      setPassPending(false);
      setPassInfo(null);
      setPassSubmitted(false);
      addNotification(message || 'Game ended');
    });

    socket.on('game:start:error', ({ message }) => {
      setError(message);
      addNotification(message);
      setLoading(false);
    });

    socket.on('player:left', ({ playerId, name }) => {
      const playerName = name || (players.find((p) => p.id === playerId) || {}).name || 'A player';
      addNotification(`${playerName} has left the game`);
    });

    socket.on('player:host', ({ playerId }) => {
      const player = players.find((p) => p.id === playerId);
      if (player) {
        addNotification(`${player.name} is the host`);
      }
    });

    socket.on('game:hand', ({ hand }) => {
      setHand(hand || []);
    });

    socket.on('game:passPending', ({ round: r, distance, target }) => {
      setPassPending(true);
      setPassSubmitted(false);
      setPassInfo({ round: r, distance, target });
      setLoading(false);
    });

    socket.on('game:roundPassPending', ({ round: r, distance }) => {
      setPassPending(true);
      setPassSubmitted(false);
      setPassInfo({ round: r, distance });
      setLoading(false);
    });

    socket.on('game:passAccepted', ({ hand: updatedHand }) => {
      if (Array.isArray(updatedHand)) {
        setHand(updatedHand);
      }
      setPassSubmitted(true);
      setLoading(false);
    });

    socket.on('game:passComplete', ({ round: r }) => {
      setGameStarted(true);
      setPassPending(false);
      setPassInfo({ round: r });
      setPassSubmitted(false);
    });

    socket.on('game:pass:error', ({ message }) => {
      setError(message);
      addNotification(message || 'Pass selection error');
      setLoading(false);
    });

    socket.on('game:state', ({ turn, pile, scores, totalScores, round }) => {
      if (turn !== undefined) setTurn(turn);
      if (pile !== undefined) setPile(pile || []);
      if (scores !== undefined) setScores(scores || {});
      if (totalScores !== undefined) setTotals(totalScores || {});
      if (round !== undefined) setRound(round || 1);
      setLastRoundSummary(null);
    });

    socket.on('game:trickResolved', ({ scores: sc, turn: t }) => {
      if (sc) setScores(sc);
      if (t) setTurn(t);
    });

    socket.on('game:roundEnd', ({ round: r, roundScores, totalScores, standings: st }) => {
      setRound(r || round);
      setScores(roundScores || {});
      setTotals(totalScores || {});
      setStandings(st || []);
      setLastRoundSummary({ round: r, roundScores: roundScores || {}, totalScores: totalScores || {} });
      setPassPending(false);
      setPassSubmitted(false);
    });

    socket.on('game:over', ({ standings: s, totalScores }) => {
      if (totalScores !== undefined) setTotals(totalScores || {});
      setStandings(s || []);
      setGameOver(true);
      setPassPending(false);
      setPassSubmitted(false);
      setPassInfo(null);
    });

    socket.on('game:play:error', ({ message }) => {
      setError(message);
      addNotification(message || 'Illegal play');
    });

    return () => {
      socket.off('players:update');
      socket.off('join:success');
      socket.off('game:started');
      socket.off('game:ended');
      socket.off('game:start:error');
      socket.off('player:left');
      socket.off('player:host');
      socket.off('game:hand');
      socket.off('game:passPending');
      socket.off('game:roundPassPending');
      socket.off('game:passAccepted');
      socket.off('game:passComplete');
      socket.off('game:pass:error');
      socket.off('game:state');
      socket.off('game:trickResolved');
      socket.off('game:roundEnd');
      socket.off('game:over');
      socket.off('game:play:error');
    };
  }, [socket]);

  // Keep isHost in sync with latest players + playerName without relying on stale closures
  useEffect(() => {
    const me = players.find((p) => p.name === playerName);
    setIsHost(Boolean(me?.isHost));
  }, [players, playerName]);

  const addNotification = useCallback((text) => {
    const id = `${Date.now()}`;
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      5000
    );
  }, []);

  const joinGame = useCallback(
    (name) => {
      if (!name || !name.trim()) {
        setError('Please enter a name');
        return;
      }
      if (!isConnected) {
        setError('Not connected to server. Please wait...');
        return;
      }
      console.log('Emitting join event for:', name.trim());
      setLoading(true);
      setError(null);
      setPlayerName(name.trim());
      socket?.emit('join', { name: name.trim() });
    },
    [socket]
  );

  const startGame = useCallback(() => {
    setLoading(true);
    setError(null);
    socket?.emit('game:start');
  }, [socket]);

  const playCard = useCallback(
    (card) => {
      socket?.emit('game:playCard', {
        playerName,
        card,
      });
    },
    [socket, playerName]
  );

  const selectPass = useCallback(
    (cards) => {
      setLoading(true);
      setError(null);
      socket?.emit('game:selectPass', {
        playerName,
        cards,
      });
    },
    [socket, playerName]
  );

  const endGame = useCallback(() => {
    socket?.emit('game:end');
  }, [socket]);

  const value = {
    playerName,
    joined,
    players,
    gameStarted,
    gameInfo,
    hand,
    turn,
    pile,
    scores,
    totals,
    round,
    standings,
    gameOver,
    notifications,
    isHost,
    loading,
    error,
    connected: isConnected,
    lastRoundSummary,
    passPending,
    passInfo,
    passSubmitted,
    isMyTurn: turn === playerName && !passPending,
    joinGame,
    startGame,
    playCard,
    selectPass,
    endGame,
    addNotification,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
