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
