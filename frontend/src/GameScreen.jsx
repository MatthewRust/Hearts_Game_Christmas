import React from 'react';
import { cardImageUrl, normalizeCard } from './utils/cardImage.js';
import tableImg from './card/Table.png';

export default function GameScreen({
  gameInfo,
  name,
  hand = [],
  turn,
  pile = [],
  scores = {},
  round = 1,
  standings = null,
  gameOver = false,
  onPlayCard,
  onEnd,
}) {
  const players = gameInfo?.players || [];
  const isMyTurn = turn === name;

  return (  
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      {/* Header with game info */}
      <div className="flex justify-between items-center mb-4 bg-gray-800 rounded-lg p-4 shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-red-500">♥ Hearts</h2>
          <div className="text-sm text-gray-400">Round {round}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            Current turn: <span className={isMyTurn ? 'text-green-400' : 'text-yellow-400'}>{turn || '—'}</span>
          </div>
          {isMyTurn && <div className="text-xs text-green-400 animate-pulse">Your turn!</div>}
        </div>
      </div>

      {/* Main game area with table background */}
      <div 
        className="flex-1 rounded-xl shadow-2xl p-8 mb-4 relative overflow-hidden"
        style={{
          backgroundImage: `url(${tableImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '400px'
        }}
      >
        {/* Pile in center */}
        <div className="flex items-center justify-center min-h-[300px]">
          {pile.length === 0 ? (
            <div className="text-white/30 text-2xl font-light">Waiting for first card...</div>
          ) : (
            <div className="flex gap-3 flex-wrap items-center justify-center">
              {pile.map((c, idx) => {
                const nc = normalizeCard(c);
                const key = nc ? `${nc.suit}-${nc.rank}-${idx}` : `pile-${idx}`;
                const url = cardImageUrl(c);
                const alt = nc ? `${nc.rank} of ${nc.suit}` : 'Card';
                return (
                  <img 
                    key={key} 
                    src={url} 
                    alt={alt} 
                    className="h-24 sm:h-28 shadow-xl rounded-lg transform hover:scale-105 transition-transform" 
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Scores overlay in top right of table */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 shadow-xl">
          <h3 className="text-lg font-bold mb-2 text-yellow-400">Scores</h3>
          <div className="space-y-1">
            {Object.entries(scores).map(([p, s]) => (
              <div key={p} className={`flex justify-between gap-4 ${p === name ? 'text-green-400 font-semibold' : 'text-white'}`}>
                <span>{p}:</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Player's hand */}
      <div className="bg-gray-800 rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            Your Hand 
            {isMyTurn && <span className="ml-2 text-green-400 text-sm">(Click a card to play)</span>}
          </h3>
          <div className="text-gray-400 text-sm">Cards: {hand?.length ?? 0}</div>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-center">
          {hand.map((c, idx) => {
            const nc = normalizeCard(c) || { rank: '?', suit: '?', value: 0 };
            const url = cardImageUrl(c);
            const label = (nc.rank !== '?' && nc.suit !== '?') ? `${nc.rank} of ${nc.suit}` : (typeof c === 'object' ? JSON.stringify(c) : String(c));
            return (
              <button
                key={`${nc.suit}-${nc.rank}-${idx}`}
                onClick={() => onPlayCard && onPlayCard({ rank: nc.rank, suit: nc.suit, value: nc.value })}
                disabled={!isMyTurn}
                className={`
                  rounded-lg overflow-hidden transition-all duration-200 transform
                  ${isMyTurn 
                    ? 'hover:scale-110 hover:-translate-y-2 hover:shadow-2xl cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                  ${!isMyTurn && 'grayscale'}
                `}
                title={`${label} - Value: ${nc.value}`}
              >
                <img src={url} alt={label} className="h-24 sm:h-28 block" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Game over or end game controls */}
      <div className="mt-4 flex justify-center">
        {gameOver && standings ? (
          <div className="bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">Final Standings</h3>
            <ol className="space-y-2 mb-6">
              {standings.map((s, i) => (
                <li 
                  key={i} 
                  className={`flex justify-between p-3 rounded ${
                    s.player === name ? 'bg-green-900/40 border border-green-500' : 'bg-gray-700'
                  }`}
                >
                  <span className="font-semibold">
                    #{s.place} {s.player}
                    {s.player === name && ' (You)'}
                  </span>
                  <span className="text-gray-400">{s.score} pts</span>
                </li>
              ))}
            </ol>
            <button 
              onClick={onEnd} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        ) : (
          <button
            onClick={onEnd}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            End Game
          </button>
        )}
      </div>
    </div>
  );
}
