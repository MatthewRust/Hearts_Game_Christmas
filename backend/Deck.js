import Card from './Card.js';

class Deck {
  constructor() {
    this._cards = []; // internal array
  }

  get cards() {
    return this._cards; // return internal array
  }

  specificCard(index) {
    return this._cards[index];
  }

  addCard(card) {
    this._cards.push(card);
  }

  removeCard(card) {
    for (let i = 0; i < this._cards.length; i++) {
      if (this._cards[i].suit === card.suit && this._cards[i].rank === card.rank) {
        this._cards.splice(i, 1);
        return;
      }
    }
  }

  // Build a standard 52-card deck with custom scoring:
  // Hearts: 2-10 => 1, J => 2, Q => 3, K => 4, A => 5
  // Queen of Spades => 13, others => 0
  makeDeck(suits, ranks) {
    this._cards = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = 0;
        if (suit === 'Hearts') {
          if (['2','3','4','5','6','7','8','9','10'].includes(rank)) value = 1;
          else if (rank === 'Jack') value = 2;
          else if (rank === 'Queen') value = 3;
          else if (rank === 'King') value = 4;
          else if (rank === 'Ace') value = 5;
        }
        if (suit === 'Spades' && rank === 'Queen') value = 13;
        this.addCard(new Card(suit, rank, value));
      }
    }
  }

  shuffle() {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
    }
  }
}

export default Deck;
