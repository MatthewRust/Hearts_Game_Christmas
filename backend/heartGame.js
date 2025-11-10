const Card = require('./Card');
const Deck = require('./Deck');
const Hand = require('./Hand');

class HeartGame {
  constructor(playerNames = []) {
    this.players = {};
    playerNames.forEach(name => {
      this.players[name] = new Hand();
    });
    this.deck = new Deck();
  }

  setUpDeck(numPlayers) {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = [
      '2', '3', '4', '5', '6', '7', '8', '9', '10',
      'Jack', 'Queen', 'King', 'Ace'
    ];

    this.deck.makeDeck(suits, ranks);
  }

  // Deal all cards evenly to all players
  dealAllCards() {
    const playerNames = Object.keys(this.players);
    const numPlayers = playerNames.length;
    
    // Shuffle the deck before dealing
    this.deck.shuffle();


    // Remove cards if needed so deck is divisible by player count
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
}
module.exports = HeartGame;
