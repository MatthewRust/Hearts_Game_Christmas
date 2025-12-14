import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Home() {
  const navigate = useNavigate();
  const { joinGame, joined, loading, error, connected } = useGame();
  const [name, setName] = useState('');

  const handleJoin = () => {
    joinGame(name);
  };

  useEffect(() => {
    if (joined) {
      navigate('/waiting-room');
    }
  }, [joined, navigate]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-gray-800 border-gray-700">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-2">♥ Hearts</h1>
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

            <Button
              onClick={handleJoin}
              disabled={!name.trim() || loading || !connected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              size="lg"
            >
              {loading ? 'Joining...' : connected ? 'Join Game' : 'Connecting...'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
