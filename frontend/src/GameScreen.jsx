
import React, { useEffect, useState } from 'react';

// Import socket from App.jsx via window or pass as prop (minimal change: use window)
const socket = window._heartsSocket || (window._heartsSocket = require('socket.io-client')('http://localhost:3001', { transports: ['websocket', 'polling'] }));

export default function GameScreen({ gameInfo, onEnd }) {
  const players = gameInfo?.players || [];
  const [hand, setHand] = useState([]);
  const [gameState, setGameState] = useState({ turn: '', pile: [], scores: {}, round: 1 });
  const [notification, setNotification] = useState('');

  useEffect(() => {
    // Listen for hand and game state updates
    socket.on('game:hand', ({ hand }) => {
      setHand(hand);
    });
    socket.on('game:state', (state) => {
      setGameState(state);
    });
    socket.on('game:trickResolved', ({ scores, turn }) => {
      setGameState((prev) => ({ ...prev, scores, turn, pile: [] }));
      setNotification('Trick resolved!');
      setTimeout(() => setNotification(''), 2000);
    });
    socket.on('game:roundEnded', ({ scores }) => {
      setGameState((prev) => ({ ...prev, scores }));
      setNotification('Round ended!');
      setTimeout(() => setNotification(''), 2000);
    });
    return () => {
      socket.off('game:hand');
      socket.off('game:state');
      socket.off('game:trickResolved');
      socket.off('game:roundEnded');
    };
  }, []);

  // Play a card: use the current user's name from gameInfo or hand context
  const myName = (() => {
    // Try to find the player whose hand matches this hand (by length and card values)
    // Or fallback to the only player if single player
    if (players.length === 1) return players[0].name;
    // Try to get from localStorage (set in App.jsx on join)
    return localStorage.getItem('hearts:name') || '';
  })();

  const playCard = (card) => {
    if (!myName) {
      alert('Could not determine your player name.');
      return;
    }
    socket.emit('game:playCard', { playerName: myName, card });
  };

  // Only show hand and state if received
  const hasHand = hand && hand.length > 0;
  const hasState = gameState && gameState.turn;

  return (
    <div>
      <h2>Hearts Game Started</h2>
      <div>Round: {gameState.round}</div>
      <div>Current turn: {gameState.turn}</div>
      <div>Scores:
        <ul>
          {Object.entries(gameState.scores).map(([name, score]) => (
            <li key={name}>{name}: {score}</li>
          ))}
        </ul>
      </div>
      <div>Pile:
        <ul>
          {gameState.pile.map((card, idx) => (
            <li key={idx}>{card.rank} of {card.suit}</li>
          ))}
        </ul>
      </div>
      <div>Your hand:
        {hasHand ? (
          <ul style={{ display: 'flex', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
            {hand.map((card, idx) => (
              <li key={idx}>
                <button onClick={() => playCard(card)} style={{ padding: '0.5rem', borderRadius: '4px' }}>
                  {card.rank} of {card.suit}
                </button>
              </li>
            ))}
          </ul>
        ) : <span>Waiting for hand...</span>}
      </div>
      {notification && <div style={{ color: 'green', marginTop: '1rem' }}>{notification}</div>}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={onEnd}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#d9534f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          End Game
        </button>
      </div>
    </div>
  );
}
