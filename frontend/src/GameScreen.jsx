import React from 'react';

export default function GameScreen({ gameInfo, onEnd }) {
  return (
    <div>
      <h2>Hearts Game Started</h2>
      <p>Players in this game:</p>
      <ul>
        {gameInfo?.players?.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <p>Game started</p>

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
