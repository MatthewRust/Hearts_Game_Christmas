class Card {
  constructor(suit, rank, value) {
    this._suit = suit;
    this._rank = rank;
    this._value = value;
  }

  get suit() {
    return this._suit;
  }
  set suit(value) {
    this._suit = value;
  }

  get rank() {
    return this._rank;
  }
  set rank(value) {
    this._rank = value;
  }

  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
  }
}

module.exports = Card;
