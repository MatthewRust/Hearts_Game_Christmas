import Hand from '../cardProps/Hand.js';

class Pile extends Hand {
  constructor() {
    super();
    this.leadSuit = null; // suit of the first card played in the pile
    this.playOrder = []; // array of player names in order of play
  }

  // Add a card to the pile, tracking play order and lead suit
  addCard(card, playerName) {
    if (this.cards.length === 0) {
      this.leadSuit = card.suit;
    }
    this.cards.push(card);
    if (playerName) this.playOrder.push(playerName);
  }

  // Check if a card is a legal play for a player (must follow suit if possible)
  isLegalPlay(card, playerHand) {
    if (!this.leadSuit) return true; // any card can be led
    const hasLeadSuit = playerHand.cards.some(c => c.suit === this.leadSuit);
    if (card.suit === this.leadSuit) return true;
    return !hasLeadSuit; // can only play off-suit if no lead suit in hand
  }

  // Calculate total points in the pile (Hearts = 1, Q♠ = 13)
  calculatePoints() {
    return this.cards.reduce((sum, card) => sum + (card.value || 0), 0);
  }

  // Determine winner of the trick (highest card of lead suit)
  calculateWinner() {
    if (!this.leadSuit || this.cards.length === 0) return null;
    let highest = null;
    let winnerIdx = -1;
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (card.suit === this.leadSuit) {
        if (!highest || this.compareRank(card.rank, highest.rank) > 0) {
          highest = card;
          winnerIdx = i;
        }
      }
    }
    return this.playOrder[winnerIdx] || null;
  }

  // Helper: compare two ranks (returns 1 if rankA > rankB, -1 if less, 0 if equal)
  compareRank(rankA, rankB) {
    const order = ['2','3','4','5','6','7','8','9','10','Jack','Queen','King','Ace'];
    return order.indexOf(rankA) - order.indexOf(rankB);
  }
}

export default Pile;
