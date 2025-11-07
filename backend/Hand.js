const Card = require('./Card');

class Hand {
  constructor() {
    this.cards = [];
  }

  get Cards() {
    return this.cards;
  }

  set Cards(value) {
    this.cards = value;
  }

  addCard(card) {
    this.cards.push(card);
  }

  removeCard(card) {
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].suit === card.suit && this.cards[i].rank === card.rank) {
        this.cards.splice(i, 1);
        return;
      }
    }
  }
}

module.exports = Hand;
