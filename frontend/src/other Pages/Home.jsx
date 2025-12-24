import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { useSpitGame } from '@/context/SpitGameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Home() {
  const navigate = useNavigate();
  const { joinGame, joined, loading: heartsLoading, error: heartsError, connected: heartsConnected } = useGame();
  const { joinGame: spitJoinGame, joined: spitJoined, loading: spitLoading, error: spitError, connected: spitConnected } = useSpitGame();
  const [name, setName] = useState('');
  const [gameMode, setGameMode] = useState(null); // 'hearts' or 'spit'

  useEffect(() => {
    if (joined) {
      navigate('/waiting-room');
    }
  }, [joined, navigate]);

  useEffect(() => {
    if (spitJoined) {
      navigate('/spit-waiting-room');
    }
  }, [spitJoined, navigate]);

  const handleHeartsJoin = () => {
    if (name.trim()) {
      joinGame(name);
    }
  };

  const handleSpitJoin = () => {
    if (name.trim()) {
      spitJoinGame(name);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && gameMode) {
      if (gameMode === 'hearts') {
        handleHeartsJoin();
      } else {
        handleSpitJoin();
      }
    }
  };

  const loading = gameMode === 'hearts' ? heartsLoading : spitLoading;
  const error = gameMode === 'hearts' ? heartsError : spitError;
  const connected = gameMode === 'hearts' ? heartsConnected : spitConnected;

  if (!gameMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-gray-800 border-gray-700">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-indigo-400 mb-2">Rust Christmas Card Games</h1>
              <p className="text-gray-400">Choose a game to play!! and watch in wonder</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setGameMode('hearts')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg"
                size="lg"
              >
                ♠ Scabby Queen
              </Button>
              <Button
                onClick={() => setGameMode('spit')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
                size="lg"
              >
                ⚡ Spit
              </Button>
              <Button
                onClick={() => navigate('/leaderboard')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-6 text-lg"
                size="lg"
              >
                🏆 Leaderboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isHearts = gameMode === 'hearts';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isHearts ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-900 to-green-800'}`}>
      <Card className={`w-full max-w-md p-8 ${isHearts ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 border-gray-700'}`}>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className={`text-4xl font-bold mb-2 ${isHearts ? 'text-blue-400' : 'text-yellow-300'}`}>
              {isHearts ? '♠ Scabby Queen' : '⚡ Spit'}
            </h1>
            <p className="text-gray-400">Join a game with friends</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-300 text-sm">
                {error}
              </div>
            )}

            {!connected && (
              <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-300 text-sm">
                Connecting to server...
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={isHearts ? handleHeartsJoin : handleSpitJoin}
                disabled={!name.trim() || loading || !connected}
                className={`flex-1 ${isHearts ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
                size="lg"
              >
                {loading ? 'Joining...' : connected ? 'Join Game' : 'Connecting...'}
              </Button>
              <Button
                onClick={() => setGameMode(null)}
                variant="outline"
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
