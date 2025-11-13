import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameScreen from './GameScreen';
import WaitingRoom from './WaitingRoom';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameInfo, setGameInfo] = useState(null);
  // Gameplay state
  const [hand, setHand] = useState([]);
  const [turn, setTurn] = useState(null);
  const [pile, setPile] = useState([]);
  const [scores, setScores] = useState({});
  const [round, setRound] = useState(1);
  const [standings, setStandings] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const notify = (text) => {
      const id = `${Date.now()}`;
      setNotifications((prev) => [...prev, { id, text }]);
      setTimeout(() => setNotifications((prev) => prev.filter(n => n.id !== id)), 5000);
    };

    const onPlayersUpdate = (updatedPlayers) => setPlayers(updatedPlayers);
    const onJoinSuccess = () => setJoined(true);
    const onGameStarted = (data) => {
      setGameInfo(data);
      setGameStarted(true);
      setGameOver(false);
      setStandings(null);
      setPile([]);
      setScores({});
    };
    const onGameEnded = ({ message }) => {
      setGameStarted(false);
      setGameInfo(null);
      setHand([]);
      setPile([]);
      setScores({});
      setStandings(null);
      notify(message || 'Game ended');
    };
    const onStartError = ({ message }) => notify(message);
    const onPlayerLeft = ({ playerId, name }) => {
      const playerName = name || (players.find(p => p.id === playerId) || {}).name || 'A player';
      notify(`${playerName} has left the game`);
    };
    const onPlayerHost = ({ playerId }) => {
      const player = players.find(p => p.id === playerId);
      if (player) notify(`${player.name} is the host`);
    };
    const onGameHand = ({ hand }) => {
      // Debug: log received hand length and sample
      try { console.log('game:hand received', Array.isArray(hand) ? hand.length : hand); } catch {}
      setHand(hand || []);
    };
    const onGameState = ({ turn, pile, scores, round }) => {
      try { console.log('game:state', { turn, pileLen: pile?.length, scores, round }); } catch {}
      if (turn !== undefined) setTurn(turn);
      if (pile !== undefined) setPile(pile || []);
      if (scores !== undefined) setScores(scores || {});
      if (round !== undefined) setRound(round || 1);
    };
    const onTrickResolved = ({ scores: sc, turn: t }) => {
      if (sc) setScores(sc);
      if (t) setTurn(t);
    };
    const onGameOver = ({ standings }) => {
      setStandings(standings || []);
      setGameOver(true);
    };
    const onPlayError = ({ message }) => notify(message || 'Illegal play');

    socket.on('players:update', onPlayersUpdate);
    socket.on('join:success', onJoinSuccess);
    socket.on('game:started', onGameStarted);
    socket.on('game:ended', onGameEnded);
    socket.on('game:start:error', onStartError);
    socket.on('player:left', onPlayerLeft);
    socket.on('player:host', onPlayerHost);
    // Gameplay events
    socket.on('game:hand', onGameHand);
    socket.on('game:state', onGameState);
    socket.on('game:trickResolved', onTrickResolved);
    socket.on('game:over', onGameOver);
    socket.on('game:play:error', onPlayError);

    return () => {
      socket.off('players:update', onPlayersUpdate);
      socket.off('join:success', onJoinSuccess);
      socket.off('game:started', onGameStarted);
      socket.off('game:ended', onGameEnded);
      socket.off('game:start:error', onStartError);
      socket.off('player:left', onPlayerLeft);
      socket.off('player:host', onPlayerHost);
      socket.off('game:hand', onGameHand);
      socket.off('game:state', onGameState);
      socket.off('game:trickResolved', onTrickResolved);
      socket.off('game:over', onGameOver);
      socket.off('game:play:error', onPlayError);
    };
  }, [players]);

  const joinGame = () => {
    if (name.trim()) {
      socket.emit('join', { name: name.trim() });
    }
  };

  

  

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      {!joined ? (
        <div>
          <h1>Join Hearts Game</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginRight: '1rem', padding: '0.5rem' }}
          />
          <button 
            onClick={joinGame}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Join
          </button>
        </div>
      ) : (
        gameStarted ? (
          <GameScreen
            gameInfo={gameInfo}
            name={name}
            hand={hand}
            turn={turn}
            pile={pile}
            scores={scores}
            round={round}
            standings={standings}
            gameOver={gameOver}
            onPlayCard={(card) => socket.emit('game:playCard', { playerName: name, card })}
            onEnd={() => socket.emit('game:end')}
          />
        ) : (
          <WaitingRoom
            name={name}
            players={players}
            notifications={notifications}
            onStart={() => socket.emit('game:start')}
          />
        )
      )}
    </div>
  );
}

export default App;