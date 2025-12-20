import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpitGame } from '@/context/SpitGameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cardImageUrl } from '@/utils/cardImage';
import tableImg from '@/card/Table.png';

export default function SpitGame() {
  const navigate = useNavigate();
  const {
    playerName,
    gameStarted,
    gameState,
    gameOver,
    winner,
    notifications,
    loading,
    error,
    playCard,
    requestSpit,
    endGame,
    waitingForOpponentSpit,
    currentRound,
  } = useSpitGame();

  const [selectedPile, setSelectedPile] = useState(null);
  const [illegalNotification, setIllegalNotification] = useState(null);

  // Redirect if game hasn't started
  useEffect(() => {
    if (!gameStarted && !gameOver) {
      navigate('/waiting-room');
    }
  }, [gameStarted, gameOver, navigate]);

  // Clear illegal notification after 2 seconds
  useEffect(() => {
    if (illegalNotification) {
      const timer = setTimeout(() => setIllegalNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [illegalNotification]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.player1.name === playerName ? gameState.player1 : gameState.player2;
  const opponent = gameState.player1.name === playerName ? gameState.player2 : gameState.player1;

  const handleCenterPileClick = (centerPileIndex) => {
    if (waitingForOpponentSpit) {
      setIllegalNotification('Waiting for opponent to spit');
      return;
    }

    if (selectedPile === null) {
      setIllegalNotification('Select a card from your piles first');
      return;
    }

    // Always attempt the play - backend will validate
    const result = playCard(selectedPile, centerPileIndex);
    
    // Check if play was successful by listening to the response
    // If backend rejects, it will send an error which shows in the error state
    setSelectedPile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <h1 className="text-4xl font-bold text-yellow-300">Spit</h1>
            <p className="text-sm text-gray-300">{playerName}</p>
            <p className="text-xs text-gray-400">Round {currentRound}</p>
          </div>
          {gameOver && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-yellow-300">
                {winner === playerName ? '🎉 You Win!' : `${winner} wins!`}
              </h2>
            </div>
          )}
          <Button
            onClick={endGame}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            End Game
          </Button>
        </div>

        {/* Error/Notification Messages */}
        {illegalNotification && (
          <div className="bg-yellow-600 text-white p-2 rounded mb-2 text-sm animate-pulse">
            ⚠️ {illegalNotification}
          </div>
        )}
        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-2 text-sm">
            ❌ {error}
          </div>
        )}
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-blue-500 text-white p-2 rounded mb-2 text-sm"
          >
            {notif.text}
          </div>
        ))}

        {/* Game Board */}
        <div className="space-y-6">
          {/* Opponent Info */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-bold mb-2">{opponent.name}</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {opponent.spitPiles.map((pile, idx) => (
                <div
                  key={`opponent-pile-${idx}`}
                  className="bg-gray-900 border border-gray-600 rounded p-3 text-center"
                >
                  {pile.topCard ? (
                    <img
                      src={cardImageUrl(pile.topCard)}
                      alt="card"
                      className="w-12 h-16 mx-auto rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 mx-auto bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Empty</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={cardImageUrl(null)}
                  alt="opponent stock"
                  className="w-12 h-16 rounded"
                />
                <span className="absolute inset-0 flex items-center justify-center text-yellow-300 font-bold">
                  {opponent.stockPileCount}
                </span>
              </div>
            </div>
          </div>

          {/* Center Piles */}
          <div className="bg-gradient-to-b from-green-700 to-green-800 border-4 border-yellow-600 rounded-lg p-8">
            <h2 className="text-white text-center text-lg font-bold mb-6">
              Center Piles {selectedPile !== null && <span className="text-yellow-300">(Click to play)</span>}
            </h2>
            <div className="flex justify-center gap-12">
              {gameState.centerPiles.map((pileData, idx) => {
                const card = pileData?.topCard || pileData;
                const length = pileData?.length || 0;
                return (
                  <div
                    key={`center-${idx}`}
                    className={`relative cursor-pointer transition-all ${
                      selectedPile !== null ? 'hover:scale-110' : ''
                    }`}
                    onClick={() => handleCenterPileClick(idx)}
                  >
                    {card ? (
                      <img
                        src={cardImageUrl(card)}
                        alt="center card"
                        className="w-24 h-32 rounded shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-32 bg-gray-500 rounded shadow-lg flex items-center justify-center">
                        <span className="text-gray-800 text-sm font-bold">Empty</span>
                      </div>
                    )}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold">
                      Pile {idx + 1}
                    </div>
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-yellow-300 text-xs">
                      ({length} cards)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Info */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">{playerName}</h3>
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={cardImageUrl(null)}
                      alt="your stock"
                      className="w-12 h-16 rounded"
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-yellow-300 font-bold">
                      {currentPlayer.stockPileCount}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={requestSpit}
                  className={`${
                    waitingForOpponentSpit
                      ? 'bg-yellow-600 hover:bg-yellow-700 animate-pulse'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  disabled={waitingForOpponentSpit}
                >
                  {waitingForOpponentSpit ? 'Waiting for Opponent...' : 'Spit!'}
                </Button>
              </div>
            </div>

            {/* Player's Spit Piles */}
            <div className="mt-4">
              <p className="text-gray-300 text-sm mb-3">
                Your Piles: {selectedPile !== null && <span className="text-yellow-300">Selected Pile {selectedPile + 1} - Click a center pile to play</span>}
              </p>
              <div className="grid grid-cols-5 gap-3">
                {currentPlayer.spitPiles.map((pile, idx) => (
                  <div
                    key={`my-pile-${idx}`}
                    className={`bg-gray-900 border-2 rounded p-3 text-center cursor-pointer transition-all ${
                      selectedPile === idx
                        ? 'border-yellow-400 shadow-lg shadow-yellow-400 scale-105'
                        : 'border-gray-600 hover:border-gray-500'
                    } ${
                      pile.topCard ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
                    } ${
                      waitingForOpponentSpit ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => pile.topCard && !waitingForOpponentSpit && setSelectedPile(selectedPile === idx ? null : idx)}
                  >
                    <div className="text-white text-xs mb-2">Pile {idx + 1}</div>
                    {pile.topCard ? (
                      <img
                        src={cardImageUrl(pile.topCard)}
                        alt="card"
                        className="w-16 h-20 mx-auto rounded"
                      />
                    ) : (
                      <div className="w-16 h-20 mx-auto bg-gray-700 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">Empty</span>
                      </div>
                    )}
                    <div className="text-gray-400 text-xs mt-2">
                      {pile.totalCards} cards
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
