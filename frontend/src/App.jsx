import { useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // backend port

function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);

  const joinGame = () => {
    if (name.trim()) {
      socket.emit('join', { name });
      setJoined(true);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      {!joined ? (
        <>
          <h1>Join Hearts Game</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginRight: '1rem' }}
          />
          <button onClick={joinGame}>Join</button>
        </>
      ) : (
        <h2>Welcome, {name}! Waiting for other players...</h2>
      )}
    </div>
  );
}

export default App;