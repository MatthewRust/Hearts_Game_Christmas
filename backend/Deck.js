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

  // Standard Hearts deck: 52 cards, values for scoring
  makeDeck(suits, ranks) {
    for (const suit of suits) {
      for (const rank of ranks) {
        if (rank == 'Queen' && suit == 'Spades') {
          this.addCard(new Card("Scabby", "Queen", 13));
        }
        if (rank == 'Hearts') {
            this.addCard(new Card(suit, rank, 1));
            if (['2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(rank)) {
                this.addCard(new Card(suit, rank, 1));
            }
            if (rank == 'Jack') {
                this.addCard(new Card(suit, rank, 2));
            }
            if (rank == 'Queen') {
                this.addCard(new Card(suit, rank, 3));
            }
            if (rank == 'King') {
                this.addCard(new Card(suit, rank, 4));
            }
            if (rank == 'Ace') {
                this.addCard(new Card(suit, rank, 5));
            }
        } else {
            this.addCard(new Card(suit, rank, 0));
        }
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
