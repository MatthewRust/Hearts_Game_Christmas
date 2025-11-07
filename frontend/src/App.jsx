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

  useEffect(() => {
    socket.on('players:update', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('join:success', (player) => {
      setJoined(true);
    });

    socket.on('game:started', (data) => {
      // data contains players and startedAt
      setGameInfo(data);
      setGameStarted(true);
    });

    socket.on('game:ended', ({ message }) => {
      // Reset client-side game state and show a notification
      setGameStarted(false);
      setGameInfo(null);
      const id = `ended:${Date.now()}`;
      setNotifications((prev) => [...prev, { id, text: message || 'Game ended' }]);
      setTimeout(() => setNotifications((prev) => prev.filter(n => n.id !== id)), 5000);
    });

    socket.on('game:start:error', ({ message }) => {
      const id = `err:${Date.now()}`;
      setNotifications((prev) => [...prev, { id, text: message }]);
      setTimeout(() => setNotifications((prev) => prev.filter(n => n.id !== id)), 5000);
    });

    socket.on('player:left', ({ playerId, name }) => {
      // Use the provided name if available; otherwise try to find it locally
      const playerName = name || (players.find(p => p.id === playerId) || {}).name || 'A player';
      const id = `${playerId}:${Date.now()}`;
      const text = `${playerName} has left the game`;
      setNotifications((prev) => [...prev, { id, text }]);

      // Auto-remove this notification after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter(n => n.id !== id));
      }, 5000);

    socket.on('player:host', ({ playerId }) => {
      const player = players.find(p => p.id === playerId);
      if (player) {
        const id = `host:${Date.now()}`;
        setNotifications((prev) => [...prev, { id, text: `${player.name} is the host` }]);
        setTimeout(() => setNotifications((prev) => prev.filter(n => n.id !== id)), 5000);
      }
    });
  }, []);

  return () => {
      socket.off('players:update');
      socket.off('join:success');
      socket.off('player:left');
      socket.off('game:started');
      socket.off('game:start:error');
      socket.off('game:ended');
    };
  }, []);

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
        gameStarted ? <GameScreen gameInfo={gameInfo} /> : (
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