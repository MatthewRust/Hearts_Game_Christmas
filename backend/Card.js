class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  } // Constructor to initialize suit and rank

  get suit() { // Getter and setters for suit and rank
    return this.suit;
  }

  get rank() {
    return this.rank;
  }

  set suit(value) {
    this.suit = value;
    }

set rank(value) {
    this.rank = value;
  }
}

module.exports = Card;
