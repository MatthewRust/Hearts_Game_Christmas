import Card from '../cardProps/Card.js';
import Deck from '../cardProps/Deck.js';
import Hand from '../cardProps/Hand.js';
import Pile from './Pile.js';

class HeartGame {
  constructor(playerNames = []) {
    this.players = {};
    playerNames.forEach(name => {
      this.players[name] = new Hand();
    });
    this.deck = new Deck();
    this.scores = {}; // per-round scores
    this.totalScores = {}; // cumulative across rounds
    playerNames.forEach(name => {
      this.scores[name] = 0;
      this.totalScores[name] = 0;
    });
    this.turnOrder = [...playerNames]; // array of player names in play order
    this.currentTurnIndex = 0; // index in turnOrder
    this.pile = new Pile();
    this.heartsBroken = false;
    this.round = 1;
    this.roundsToPlay = Math.max(playerNames.length, 1);
  }

  setUpDeck() {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = [
      '2', '3', '4', '5', '6', '7', '8', '9', '10',
      'Jack', 'Queen', 'King', 'Ace'
    ];
    this.deck.makeDeck(suits, ranks);
  }

  dealAllCards() {
    const playerNames = Object.keys(this.players);
    const numPlayers = playerNames.length;
    this.deck.shuffle();
    const removalOrder = [
      { rank: '2', suit: 'Clubs' },
      { rank: '2', suit: 'Diamonds' },
      { rank: '2', suit: 'Spades' },
      { rank: '3', suit: 'Clubs' },
      { rank: '3', suit: 'Diamonds' },
      { rank: '3', suit: 'Spades' },
      { rank: '4', suit: 'Clubs' },
      { rank: '4', suit: 'Diamonds' },
      { rank: '4', suit: 'Spades' },
    ];
    while (this.deck.cards.length % numPlayers !== 0 && removalOrder.length > 0) {
      const { rank, suit } = removalOrder.shift();
      const idx = this.deck.cards.findIndex(card => card.rank === rank && card.suit === suit);
      if (idx !== -1) {
        this.deck.cards.splice(idx, 1);
      }
    }
    let i = 0;
    while (this.deck.cards.length > 0) {
      const card = this.deck.cards[0];
      this.players[playerNames[i % numPlayers]].addCard(card);
      this.deck.removeCard(card);
      i++;
    }
    // Optionally sort hands for consistency (by suit then rank)
    const rankOrder = ['2','3','4','5','6','7','8','9','10','Jack','Queen','King','Ace'];
    Object.values(this.players).forEach(hand => {
      hand.cards.sort((a,b) => (a.suit.localeCompare(b.suit)) || (rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)));
    });
  }

  // Get the name of the player whose turn it is
  getCurrentPlayer() {
    return this.turnOrder[this.currentTurnIndex];
  }

  // Advance to the next player's turn
  nextTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  }

  // Player attempts to play a card
  playCard(playerName, card) {
    if (this.getCurrentPlayer() !== playerName) {
      throw new Error("Not this player's turn");
    }
    const hand = this.players[playerName];
    // Enforce hearts not being led until broken, unless only hearts are in hand
    if (this.pile.cards.length === 0 && card.suit === 'Hearts' && !this.heartsBroken) {
      const hasNonHearts = hand.cards.some(c => c.suit !== 'Hearts');
      if (hasNonHearts) {
        throw new Error('Cannot lead Hearts until they are broken');
      }
    }
    if (!this.pile.isLegalPlay(card, hand)) {
      throw new Error('Illegal play: must follow suit if possible');
    }
    hand.removeCard(card);
    this.pile.addCard(card, playerName);
    // If a heart or Q♠ is played, mark hearts as broken
    if (card.suit === 'Hearts' || (card.suit === 'Spades' && card.rank === 'Queen')) {
      this.heartsBroken = true;
    }
    // If pile is full, resolve trick
    if (this.pile.cards.length === this.turnOrder.length) {
      this.resolveTrick();
    } else {
      this.nextTurn();
    }
  }

  // Resolve the trick, assign points, and set up for next trick
  resolveTrick() {
    const winner = this.pile.calculateWinner();
    const points = this.pile.calculatePoints();
    if (winner) {
      this.scores[winner] += points;
      // Winner leads next trick
      this.currentTurnIndex = this.turnOrder.indexOf(winner);
    }
    // Reset pile for next trick
    this.pile = new Pile();
  }

  // Check if round is over (all hands empty)
  isRoundOver() {
    return Object.values(this.players).every(hand => hand.cards.length === 0);
  }

  // Finish current round: apply shoot-the-moon, update totals, build summary
  finishRound() {
    this.checkShootTheMoon();

    // Add this round's scores to totals
    for (const player of this.turnOrder) {
      this.totalScores[player] = (this.totalScores[player] || 0) + (this.scores[player] || 0);
    }

    const summary = {
      round: this.round,
      roundScores: { ...this.scores },
      totalScores: { ...this.totalScores },
      standings: this.getStandings(),
    };

    return summary;
  }

  // Check for "Shoot the Moon": if one player has all 36 points, give them 0 and everyone else 36
  checkShootTheMoon() {
    // Calculate round points (not cumulative)
    const roundPoints = {};
    for (const player of this.turnOrder) {
      roundPoints[player] = this.scores[player] || 0;
    }
    
    // Check if exactly one player has 36 points
    const playersWith36 = Object.entries(roundPoints).filter(([p, pts]) => pts === 36);
    
    if (playersWith36.length === 1) {
      const shooter = playersWith36[0][0];
      // Reset shooter to 0, give everyone else 36
      this.scores[shooter] = 0;
      for (const player of this.turnOrder) {
        if (player !== shooter) {
          this.scores[player] = 36;
        }
      }
    }
  }

  // Start a new round
  startNewRound() {
    this.round++;
    // reset per-round scores
    for (const player of this.turnOrder) {
      this.scores[player] = 0;
    }
    this.setUpDeck();
    this.dealAllCards();
    this.pile = new Pile();
    this.heartsBroken = false;
    // Set leader to the player with 2 of Clubs if present
    this.setInitialLeader();
  }

  // Determine leader based on holder of 2 of Clubs, fallback to index 0
  setInitialLeader() {
    const twoClubs = { suit: 'Clubs', rank: '2' };
    for (const [playerName, hand] of Object.entries(this.players)) {
      if (hand.cards.some(c => c.suit === twoClubs.suit && c.rank === twoClubs.rank)) {
        this.currentTurnIndex = this.turnOrder.indexOf(playerName);
        return;
      }
    }
    this.currentTurnIndex = 0;
  }

  // Compute standings: least points is best. Dense ranking for ties.
  getStandings() {
    const entries = Object.entries(this.totalScores).map(([player, score]) => ({ player, score }));
    entries.sort((a, b) => a.score - b.score);
    // Dense ranking
    let place = 0;
    let lastScore = null;
    return entries.map((e) => {
      if (lastScore === null || e.score !== lastScore) {
        place += 1;
        lastScore = e.score;
      }
      return { player: e.player, score: e.score, place };
    });
  }

  hasMoreRounds() {
    return this.round < this.roundsToPlay;
  }
}

export default HeartGame;