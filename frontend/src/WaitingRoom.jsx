import React from 'react';

export default function WaitingRoom({ name, players, notifications, onStart }) {
  const me = players.find(p => p.name === name);
  const isHost = me && me.isHost;
  return (
    <div>
      <h2>Welcome, {name}!</h2>
      <h3>Players in Waiting Room:</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {players.map((player) => (
          <li key={player.id} style={{ margin: '0.5rem 0', padding: '0.5rem', backgroundColor: player.isHost ? '#ffe082' : '#f0f0f0', borderRadius: '4px' }}>
            {player.name}{player.isHost ? ' (Host)' : ''}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '1rem' }}>
        {isHost && (
          <button
            onClick={onStart}
            disabled={players.length < 2}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: players.length < 2 ? '#cccccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: players.length < 2 ? 'not-allowed' : 'pointer'
            }}
          >
            Start Game
          </button>
        )}
      </div>

      {/* Notifications area */}
      <div style={{ marginTop: '1.5rem' }}>
        {notifications.map((n) => (
          <div key={n.id} style={{
            padding: '0.5rem',
            backgroundColor: '#fff4e5',
            color: '#6a4a00',
            marginTop: '0.5rem',
            borderRadius: '4px'
          }}>{n.text}</div>
        ))}
      </div>
    </div>
  );
}
