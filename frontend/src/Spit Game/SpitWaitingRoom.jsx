import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpitGame } from '@/context/SpitGameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SpitWaitingRoom() {
  const navigate = useNavigate();
  const {
    playerName,
    joined,
    players,
    connected,
    loading,
    error,
    gameStarted,
    joinGame,
    startGame,
    endGame,
    leaveWaitingRoom,
  } = useSpitGame();

  const [inputName, setInputName] = useState('');

  useEffect(() => {
    if (gameStarted) {
      navigate('/spit-game');
    }
  }, [gameStarted, navigate]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputName.trim()) {
      joinGame(inputName);
      setInputName('');
    }
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleEndGame = () => {
    endGame();
    navigate('/');
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-yellow-300 text-center mb-2">
              Spit
            </h1>
            <p className="text-gray-300 text-center mb-6">
              Fast-paced card game for 2 players
            </p>

            {!connected && (
              <div className="bg-yellow-600 text-white p-3 rounded mb-4 text-sm">
                Connecting to server...
              </div>
            )}

            {error && (
              <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleJoin}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Your Name
                </label>
                <Input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={!connected || loading}
                  className="w-full"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!connected || loading || !inputName.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h1 className="text-4xl font-bold text-yellow-300 mb-2">Spit</h1>
          <p className="text-gray-300 mb-4">Waiting for players...</p>

          {error && (
            <div className="bg-red-600 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-3">Players ({players.length}/2)</h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-700 border border-gray-600 rounded p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="text-white font-semibold">{player.name}</p>
                    <p className="text-gray-400 text-sm">
                      {player.id === players.find((p) => p.name === playerName)?.id
                        ? '(You)'
                        : '(Opponent)'}
                    </p>
                  </div>
                  <div className="text-2xl">
                    {player.id === players.find((p) => p.name === playerName)?.id
                      ? '👤'
                      : '👥'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {players.length === 2 && (
            <Button
              onClick={handleStartGame}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold mb-3"
            >
              {loading ? 'Starting...' : 'Start Game'}
            </Button>
          )}

          {players.length < 2 && (
            <div className="mt-4 mb-3 text-center text-gray-400">
              Waiting for another player to join... ({players.length}/2)
            </div>
          )}

          <Button
            onClick={() => {
              leaveWaitingRoom();
              navigate('/');
            }}
            variant="outline"
            className="w-full bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            ← Home
          </Button>
        </div>
      </div>
    </div>
  );
}
