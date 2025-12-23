import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cardImageUrl, normalizeCard } from '@/utils/cardImage';
import tableImg from '@/card/Table.png';

export default function GamePage() {
  const navigate = useNavigate();
  const {
    gameStarted,
    gameOver,
    playerName,
    hand,
    turn,
    pile,
    scores,
    totals,
    round,
    standings,
    isMyTurn,
    loading,
    passPending,
    passInfo,
    passSubmitted,
    endGame,
    playCard,
    selectPass,
    lastRoundSummary,
  } = useGame();

  const [selectedPass, setSelectedPass] = useState([]);

  useEffect(() => {
    if (!gameStarted && !passPending) {
      navigate('/waiting-room');
    }
  }, [gameStarted, passPending, navigate]);

  useEffect(() => {
    if (!passPending) {
      setSelectedPass([]);
    }
  }, [passPending]);

  const handlePlayCard = (card) => {
    if (passPending) return;
    playCard(card);
  };

  const togglePassSelection = (card) => {
    const key = `${card.suit}-${card.rank}`;
    const exists = selectedPass.find((c) => `${c.suit}-${c.rank}` === key);
    if (exists) {
      setSelectedPass((prev) => prev.filter((c) => `${c.suit}-${c.rank}` !== key));
    } else if (selectedPass.length < 2) {
      setSelectedPass((prev) => [...prev, card]);
    }
  };

  const submitPass = () => {
    if (selectedPass.length !== 2) return;
    selectPass(selectedPass);
  };

  const handleEndGame = () => {
    endGame();
    navigate('/waiting-room');
  };

  if (!gameStarted && !passPending) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 bg-gray-800 rounded-lg p-3 md:p-4 shadow-lg gap-2 md:gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-black-500">♠ Scabby Queen</h2>
          <div className="text-xs md:text-sm text-gray-400">Round {round}</div>
        </div>
        <div className="text-right text-sm md:text-base">
          {passPending ? (
            <div className="md:text-lg font-semibold text-orange-300">Pass 2 cards to {passInfo?.target || 'next player'}</div>
          ) : (
            <>
              <div className="md:text-lg font-semibold">
                Current turn:{' '}
                <span className={isMyTurn ? 'text-green-400' : 'text-yellow-400'}>
                  {turn || '—'}
                </span>
              </div>
              {isMyTurn && (
                <div className="text-xs text-green-400 animate-pulse">Your turn!</div>
              )}
            </>
          )}
        </div>
      </div>
      <div
        className="flex-1 rounded-xl shadow-2xl p-4 md:p-8 mb-4 relative overflow-hidden"
        style={{
          backgroundImage: `url(${tableImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '250px',
        }}
      >
        <div className="flex items-center justify-center min-h-[200px] md:min-h-[300px]">
          {pile.length === 0 ? (
            <div className="text-white/30 text-2xl font-light">
              Waiting for first card...
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap items-center justify-center">
              {pile.map((c, idx) => {
                const nc = normalizeCard(c);
                const key = nc
                  ? `${nc.suit}-${nc.rank}-${idx}`
                  : `pile-${idx}`;
                const url = cardImageUrl(c);
                const alt = nc
                  ? `${nc.rank} of ${nc.suit}`
                  : 'Card';
                return (
                  <img
                    key={key}
                    src={url}
                    alt={alt}
                    className="h-16 sm:h-20 md:h-24 lg:h-28 shadow-xl rounded-lg transform hover:scale-105 transition-transform"
                  />
                );
              })}
            </div>
          )}
        </div>
        <div className="hidden md:block absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 shadow-xl">
          <h3 className="text-lg font-bold mb-2 text-yellow-400">Scores</h3>
          <div className="space-y-1">
            {Object.entries(scores).map(([p, s]) => (
              <div
                key={p}
                className={`flex justify-between gap-4 ${
                  p === playerName
                    ? 'text-green-400 font-semibold'
                    : 'text-white'
                }`}
              >
                <span>{p}:</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          {Object.keys(totals || {}).length > 0 && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <h4 className="text-sm font-semibold text-blue-300 mb-1">Total Points</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(totals).map(([p, t]) => (
                  <div key={`tot-${p}`} className="flex justify-between">
                    <span className={p === playerName ? 'text-green-400 font-semibold' : 'text-white'}>{p}:</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scores box for mobile only - positioned after table */}
      <div className="md:hidden bg-black/70 backdrop-blur-sm rounded-lg p-3 mb-4 shadow-xl">
        <h3 className="text-base font-bold mb-2 text-yellow-400">Scores</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Current Round</div>
            <div className="space-y-1">
              {Object.entries(scores).map(([p, s]) => (
                <div key={p} className={`text-xs flex justify-between ${
                  p === playerName ? 'text-green-400 font-semibold' : 'text-white'
                }`}>
                  <span>{p}:</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
          {Object.keys(totals || {}).length > 0 && (
            <div>
              <div className="text-xs text-blue-300 mb-1">Total Points</div>
              <div className="space-y-1">
                {Object.entries(totals).map(([p, t]) => (
                  <div key={`tot-${p}`} className={`text-xs flex justify-between ${
                    p === playerName ? 'text-green-400 font-semibold' : 'text-white'
                  }`}>
                    <span>{p}:</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {lastRoundSummary && (
        <Card className="bg-indigo-900/40 border border-indigo-500 text-white mb-4">
          <div className="p-3 md:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Round {lastRoundSummary.round} complete</div>
              <div className="text-sm text-indigo-200">Totals updated</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-indigo-200 mb-1">Round Points</div>
                <div className="space-y-1 text-sm">
                  {Object.entries(lastRoundSummary.roundScores || {}).map(([p, s]) => (
                    <div key={`rs-${p}`} className="flex justify-between">
                      <span className={p === playerName ? 'text-green-300 font-semibold' : 'text-white'}>{p}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-indigo-200 mb-1">Total Points</div>
                <div className="space-y-1 text-sm">
                  {Object.entries(lastRoundSummary.totalScores || {}).map(([p, t]) => (
                    <div key={`ts-${p}`} className="flex justify-between">
                      <span className={p === playerName ? 'text-green-300 font-semibold' : 'text-white'}>{p}</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      <Card className="bg-gray-800 rounded-xl shadow-xl p-3 md:p-6 border-gray-700">
        {passPending && (
          <div className="mb-4 p-3 md:p-4 rounded-lg bg-yellow-900/40 border border-yellow-500 text-yellow-100">
            <div className="font-semibold mb-1 text-sm md:text-base">Select exactly 2 cards to pass</div>
            <div className="text-xs md:text-sm text-yellow-200">
              Passing to {passInfo?.target || `player ${passInfo?.distance || ''} to your left`}
            </div>
            <div className="mt-2 text-xs text-yellow-200">
              {passSubmitted ? 'Selection locked in. Waiting for others...' : 'Click cards below to select. Then press Confirm Pass.'}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {selectedPass.map((c, idx) => (
                <span key={`${c.suit}-${c.rank}-${idx}`} className="px-2 py-1 bg-yellow-500/30 rounded text-xs border border-yellow-400">
                  {c.rank} of {c.suit}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2 flex-col md:flex-row">
              <Button
                onClick={submitPass}
                disabled={selectedPass.length !== 2 || passSubmitted || loading}
                className="bg-yellow-500 text-black hover:bg-yellow-400 text-sm md:text-base"
              >
                {passSubmitted ? 'Waiting for others...' : 'Confirm Pass'}
              </Button>
              <Button
                onClick={() => setSelectedPass([])}
                disabled={passSubmitted || loading}
                variant="outline"
                className="border-yellow-400 text-yellow-200 text-sm md:text-base"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
          <h3 className="text-lg md:text-xl font-bold">
            Your Hand
            {!passPending && isMyTurn && (
              <span className="ml-2 text-green-400 text-xs md:text-sm">
                (Click a card to play)
              </span>
            )}
          </h3>
          <div className="text-gray-400 text-xs md:text-sm">Cards: {hand?.length ?? 0}</div>
        </div>

        <div className="flex gap-1 md:gap-2 flex-wrap justify-center">
          {hand.map((c, idx) => {
            const nc = normalizeCard(c) || {
              rank: '?',
              suit: '?',
              value: 0,
            };
            const url = cardImageUrl(c);
            const label =
              nc.rank !== '?' && nc.suit !== '?'
                ? `${nc.rank} of ${nc.suit}`
                : typeof c === 'object'
                  ? JSON.stringify(c)
                  : String(c);

            const isSelected = selectedPass.some((sp) => sp.rank === nc.rank && sp.suit === nc.suit);

            return (
              <button
                key={`${nc.suit}-${nc.rank}-${idx}`}
                onClick={() =>
                  passPending
                    ? togglePassSelection({ rank: nc.rank, suit: nc.suit, value: nc.value })
                    : handlePlayCard({
                        rank: nc.rank,
                        suit: nc.suit,
                        value: nc.value,
                      })
                }
                disabled={(passPending && passSubmitted) || (!passPending && (!isMyTurn || loading))}
                className={`
                  rounded-lg overflow-hidden transition-all duration-200 transform
                  ${
                    passPending
                      ? 'hover:scale-105 cursor-pointer'
                      : isMyTurn
                        ? 'hover:scale-110 hover:-translate-y-2 hover:shadow-2xl cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                  }
                  ${passPending ? 'border-4 border-dashed border-yellow-500/60' : ''}
                  ${isSelected ? 'ring-4 ring-yellow-400' : ''}
                  ${!passPending && !isMyTurn && 'grayscale'}
                `}
                title={`${label} - Value: ${nc.value}`}
              >
                <img
                  src={url}
                  alt={label}
                  className="h-14 sm:h-20 md:h-24 lg:h-28 block"
                />
              </button>
            );
          })}
        </div>
      </Card>
      <div className="mt-4 flex justify-center">
        {gameOver && standings ? (
          <Card className="bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
              Final Standings
            </h3>
            <ol className="space-y-2 mb-6">
              {standings.map((s, i) => (
                <li
                  key={i}
                  className={`flex justify-between p-3 rounded ${
                    s.player === playerName
                      ? 'bg-green-900/40 border border-green-500'
                      : 'bg-gray-700'
                  }`}
                >
                  <span className="font-semibold">
                    #{s.place} {s.player}
                    {s.player === playerName && ' (You)'}
                  </span>
                  <span className="text-gray-400">{s.score} pts</span>
                </li>
              ))}
            </ol>
            <Button
              onClick={handleEndGame}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Back to Lobby
            </Button>
          </Card>
        ) : (
          <Button
            onClick={handleEndGame}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
            size="lg"
          >
            End Game
          </Button>
        )}
      </div>
    </div>
  );
}
