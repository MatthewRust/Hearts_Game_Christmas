import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function WaitingRoom() {
  const navigate = useNavigate();
  const {joined,playerName, players, isHost, gameStarted, notifications, loading, error, startGame} = useGame();

  useEffect(() => {
    if (!joined) {navigate('/');}
  }, [joined, navigate]);

  useEffect(() => {
    if (gameStarted) {
      navigate('/game');
    }
  }, [gameStarted, navigate]);

  if (!joined) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-2">♥ Hearts</h1>
            <p className="text-gray-300 text-lg">Welcome, <span className="font-semibold text-blue-400">{playerName}</span>!</p>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Players ({players.length})</h2>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  player.isHost
                    ? 'bg-yellow-500/20 border border-yellow-500'
                    : 'bg-gray-700'
                }`}
              >
                <span className="text-white font-medium">{player.name}</span>
                {player.isHost && (
                  <span className="text-xs font-semibold text-yellow-400">HOST</span>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700 p-6">
          {isHost && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Your the host click the button at the bottom to start the game when ready!!!!
              </p>
              <Button
                onClick={startGame}
                disabled={players.length < 2 || loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                size="lg"
              >
                {loading ? 'Starting...' : 'Start Game'}
              </Button>
            </div>
          )}

          {!isHost && (
            <p className="text-gray-400 text-center">
              Waiting for <span className="font-semibold">{players.find((p) => p.isHost)?.name || 'host'}</span> to start the game...
            </p>
          )}
        </Card>

        {error && (
          <Card className="bg-red-500/10 border border-red-500 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </Card>
        )}

        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className="bg-blue-500/20 border border-blue-500 p-3"
              >
                <p className="text-blue-300 text-sm">{notif.text}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
