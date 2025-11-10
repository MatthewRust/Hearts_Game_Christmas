import Card from './Card.js';
import Deck from './Deck.js';
import Hand from './Hand.js';
import Pile from './Pile.js';

class HeartGame {
  constructor(playerNames = []) {
    this.players = {};
    playerNames.forEach(name => {
      this.players[name] = new Hand();
    });
    this.deck = new Deck();
    this.scores = {};
    playerNames.forEach(name => {
      this.scores[name] = 0;
    });
    this.turnOrder = [...playerNames]; // array of player names in play order
    this.currentTurnIndex = 0; // index in turnOrder
    this.pile = new Pile();
    this.heartsBroken = false;
    this.round = 1;
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
    if (!this.pile.isLegalPlay(card, hand)) {
      throw new Error('Illegal play: must follow suit if possible');
    }
    hand.removeCard(card);
    this.pile.addCard(card, playerName);
    // If a heart is played, mark hearts as broken
    if (card.suit === 'Hearts') {
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

  // Start a new round
  startNewRound() {
    this.round++;
    this.setUpDeck();
    this.dealAllCards();
    this.pile = new Pile();
    this.heartsBroken = false;
    // Optionally rotate turn order for fairness
    // this.turnOrder.push(this.turnOrder.shift());
    this.currentTurnIndex = 0;
  }
}

export default HeartGame;
