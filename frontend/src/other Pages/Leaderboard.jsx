import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-gray-400 font-bold">{index + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
              <Trophy className="inline-block w-10 h-10 mr-2" />
              Leaderboard
            </h1>
            <p className="text-gray-300 text-lg">Top Players</p>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          {loading && (
            <div className="text-center text-gray-400 py-8">
              Loading leaderboard...
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded p-4 text-red-300 text-center">
              {error}
            </div>
          )}

          {!loading && !error && leaderboard.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Dougall is lonely come play 
            </div>
          )}

          {!loading && !error && leaderboard.length > 0 && (
            <div className="space-y-3">
              {leaderboard.map((player, index) => (
                <div
                  key={player.username}
                  className={`p-4 rounded-lg flex items-center justify-between ${
                    index === 0
                      ? 'bg-yellow-500/20 border border-yellow-500'
                      : index === 1
                      ? 'bg-gray-500/20 border border-gray-500'
                      : index === 2
                      ? 'bg-amber-600/20 border border-amber-600'
                      : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(index)}
                    </div>
                    <span className="text-white font-semibold text-lg">
                      {player.username}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-400">
                      {player.wins}
                    </div>
                    <div className="text-xs text-gray-400">
                      {player.wins === 1 ? 'win' : 'wins'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
            size="lg"
          >
            ← Home
          </Button>
          <Button
            onClick={fetchLeaderboard}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
    </div>
  );
}
