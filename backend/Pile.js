const Hand = require('./Hand');

class Pile extends Hand {
  constructor() {
    super();
  }

  // Add methods for calculating winner and points here
  // Example placeholder:
  calculateWinner() {
    // Implement logic to determine winner of the pile
    return null;
  }

  calculatePoints() {
    // Implement logic to sum points in the pile
    return 0;
  }
}

module.exports = Pile;
