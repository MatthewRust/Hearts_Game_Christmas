import Card from './Card.js';

class Hand {
  constructor() {
    this.cards = [];
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

export default Hand;
