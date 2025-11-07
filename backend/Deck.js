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
}

module.exports = Deck;
