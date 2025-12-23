import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpitGame } from '@/context/SpitGameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cardImageUrl } from '@/utils/cardImage';
import tableImg from '@/card/Table.png';
import dougalIcon from '@/assets/DougalPixel.png';

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

  const handleBackToWaitingRoom = () => {
    navigate('/spit-waiting-room');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Victory Banner/Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-300 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
              <div className="flex items-center justify-center gap-8">
                {/* Dougal Image */}
                <img
                  src={dougalIcon}
                  alt="Dougal"
                  className="w-32 h-32 md:w-40 md:h-40 pixelated"
                />
                
                {/* Winner Text */}
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                    {winner} is am an winner
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-8">
                <Button
                  onClick={handleBackToWaitingRoom}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold text-lg py-3"
                >
                  Return to Waiting Room
                </Button>
                <Button
                  onClick={endGame}
                  variant="outline"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white border-gray-600 font-bold"
                >
                  Leave Game
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-3 md:mb-6 flex-col md:flex-row gap-2">
          <div className="text-white text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-300">Spit</h1>
            <p className="text-xs md:text-sm text-gray-300">{playerName}</p>
            <p className="text-xs text-gray-400">Round {currentRound}</p>
          </div>
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
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
            <h3 className="text-white font-bold text-sm md:text-base mb-2">{opponent.name}</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-1 md:gap-2 mb-4">
              {opponent.spitPiles.map((pile, idx) => (
                <div
                  key={`opponent-pile-${idx}`}
                  className="bg-gray-900 border border-gray-600 rounded p-1 md:p-3 text-center"
                >
                  {pile.topCard ? (
                    <img
                      src={cardImageUrl(pile.topCard)}
                      alt="card"
                      className="w-10 md:w-12 h-14 md:h-16 mx-auto rounded"
                    />
                  ) : (
                    <div className="w-10 md:w-12 h-14 md:h-16 mx-auto bg-gray-700 rounded flex items-center justify-center">
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
              {opponent.stockPileCount === 0 && (
                <div className="text-red-400 text-xs md:text-sm font-bold animate-pulse">
                  ⚠️ Out of Stock!
                </div>
              )}
            </div>
          </div>

          {/* Center Piles */}
          <div className="bg-gradient-to-b from-green-700 to-green-800 border-4 border-yellow-600 rounded-lg p-4 md:p-8">
            <h2 className="text-white text-center text-base md:text-lg font-bold mb-4 md:mb-6">
              Center Piles {selectedPile !== null && <span className="text-yellow-300">(Click to play)</span>}
            </h2>
            <div className="flex justify-center gap-6 md:gap-12">
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
                        className="w-16 md:w-24 h-20 md:h-32 rounded shadow-lg"
                      />
                    ) : (
                      <div className="w-16 md:w-24 h-20 md:h-32 bg-gray-500 rounded shadow-lg flex items-center justify-center">
                        <span className="text-gray-800 text-sm font-bold">Empty</span>
                      </div>
                    )}
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
                <div className="flex items-center gap-2">
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
                  {currentPlayer.stockPileCount === 0 && (
                    <div className="text-red-400 text-xs md:text-sm font-bold">
                      ⚠️ Out of Stock!
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={requestSpit}
                  className={`${
                    waitingForOpponentSpit
                      ? 'bg-yellow-600 hover:bg-yellow-700 animate-pulse'
                      : opponent.stockPileCount === 0
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  disabled={waitingForOpponentSpit || currentPlayer.stockPileCount === 0}
                >
                  {waitingForOpponentSpit 
                    ? 'Waiting for Opponent...' 
                    : opponent.stockPileCount === 0 
                    ? 'Spit Solo!' 
                    : 'Spit!'}
                </Button>
              </div>
            </div>

            {/* Player's Spit Piles */}
            <div className="mt-4">
              <p className="text-gray-300 text-xs md:text-sm mb-3">
                Your Piles: {selectedPile !== null && <span className="text-yellow-300 text-xs md:text-sm">Selected Pile {selectedPile + 1} - Click center pile</span>}
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:flex-nowrap md:grid md:grid-cols-5 md:justify-start md:gap-3">
                {currentPlayer.spitPiles.map((pile, idx) => (
                  <div
                    key={`my-pile-${idx}`}
                    className={`bg-gray-900 border-2 rounded p-2 md:p-3 text-center cursor-pointer transition-all ${
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
                    <div className="text-white text-xs mb-1 md:mb-2">Pile {idx + 1}</div>
                    {pile.topCard ? (
                      <img
                        src={cardImageUrl(pile.topCard)}
                        alt="card"
                        className="w-12 md:w-16 h-16 md:h-20 mx-auto rounded"
                      />
                    ) : (
                      <div className="w-12 md:w-16 h-16 md:h-20 mx-auto bg-gray-700 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">Empty</span>
                      </div>
                    )}
                    <div className="text-gray-400 text-xs mt-1 md:mt-2">
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
