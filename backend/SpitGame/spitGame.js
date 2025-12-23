import Card from '../cardProps/Card.js';
import Deck from '../cardProps/Deck.js';
import Hand from '../cardProps/Hand.js';

class SpitGame {
  constructor(player1Name, player2Name) {
    this.player1Name = player1Name;
    this.player2Name = player2Name;
    this.players = {
      [player1Name]: {
        name: player1Name,
        spitPiles: [[], [], [], [], []], // 5 piles, each pile is array of cards (bottom to top)
        spitPilesFaceUp: [false, false, false, false, false], // track which are face-up
        stockPile: [], // face-down stock cards
        handSize: 0, // total cards in player's control
      },
      [player2Name]: {
        name: player2Name,
        spitPiles: [[], [], [], [], []],
        spitPilesFaceUp: [false, false, false, false, false],
        stockPile: [],
        handSize: 0,
      },
    };

    this.centerPiles = [[], []]; // two center piles
    this.deck = new Deck();
    this.gameOver = false;
    this.winner = null;
    this.round = 1;
    this.roundOver = false;
    this.rankOrder = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
  }

  /**
   * Initialize and deal the game
   */
  setupGame() {
    // Create and shuffle deck (no special scoring for Spit - all values = 0)
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
    
    // Build deck manually with value=0 for all cards (suits don't matter in Spit)
    this.deck._cards = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.addCard(new Card(suit, rank, 0));
      }
    }
    
    this.deck.shuffle();

    const allCards = [...this.deck.cards];
    this.deck._cards = [];

    // Deal 26 cards to each player
    const player1Cards = allCards.slice(0, 26);
    const player2Cards = allCards.slice(26, 52);

    this.dealPlayerCards(this.player1Name, player1Cards);
    this.dealPlayerCards(this.player2Name, player2Cards);

    // Initialize center piles with top card from each player's stock
    const p1TopStock = this.players[this.player1Name].stockPile.pop();
    const p2TopStock = this.players[this.player2Name].stockPile.pop();

    if (p1TopStock) {
      this.centerPiles[0].push(p1TopStock);
      this.players[this.player1Name].handSize--;
    }
    if (p2TopStock) {
      this.centerPiles[1].push(p2TopStock);
      this.players[this.player2Name].handSize--;
    }
  }

  /**
   * Deal 26 cards to a player: 15 in spit piles (1,2,3,4,5), 11 in stock
   */
  dealPlayerCards(playerName, cards) {
    const player = this.players[playerName];
    let cardIndex = 0;

    // Deal spit piles: 1, 2, 3, 4, 5 cards
    for (let pileIdx = 0; pileIdx < 5; pileIdx++) {
      const cardsForPile = pileIdx + 1;
      for (let i = 0; i < cardsForPile; i++) {
        player.spitPiles[pileIdx].push(cards[cardIndex]);
        cardIndex++;
      }
    }

    // Remaining cards (11) go to stock pile
    while (cardIndex < cards.length) {
      player.stockPile.push(cards[cardIndex]);
      cardIndex++;
    }

    // Flip top card of each spit pile face-up
    for (let pileIdx = 0; pileIdx < 5; pileIdx++) {
      if (player.spitPiles[pileIdx].length > 0) {
        player.spitPilesFaceUp[pileIdx] = true;
      }
    }

    // Calculate total hand size based on actual cards
    player.handSize = cards.length;
  }

  /**
   * Check if a card can be played on a center pile
   * Card must be same rank, 1 rank higher, or 1 rank lower than the top card
   * Wraps around: King can play on Ace, Ace can play on King
   */
  isLegalPlay(card, centerPileIndex) {
    if (centerPileIndex < 0 || centerPileIndex >= this.centerPiles.length) {
      return false;
    }

    const centerPile = this.centerPiles[centerPileIndex];
    if (centerPile.length === 0) {
      return false; // shouldn't happen
    }

    const topCard = centerPile[centerPile.length - 1];
    
    // Normalize ranks to handle both string and object formats
    const cardRankStr = card.rank || card._rank || String(card);
    const topRankStr = topCard.rank || topCard._rank || String(topCard);
    
    const cardRank = this.rankOrder.indexOf(cardRankStr);
    const topRank = this.rankOrder.indexOf(topRankStr);

    console.log(`Checking play: ${cardRankStr} (index ${cardRank}) on ${topRankStr} (index ${topRank})`);

    // Both ranks must be found in the order
    if (cardRank === -1 || topRank === -1) {
      console.log('Rank not found in rankOrder');
      return false;
    }

    // Valid if same rank, 1 rank apart, or King-Ace wrap (diff of 12)
    const diff = Math.abs(cardRank - topRank);
    console.log(`Rank difference: ${diff}`);
    
    // Allow: same rank (0), adjacent ranks (1), or King-Ace wrap (12)
    return diff === 0 || diff === 1 || diff === this.rankOrder.length - 1;
  }

  /**
   * Get the top face-up card from a spit pile (if any)
   */
  getTopSpitCard(playerName, pileIndex) {
    const player = this.players[playerName];
    if (pileIndex < 0 || pileIndex >= 5) {
      return null;
    }

    const pile = player.spitPiles[pileIndex];
    if (pile.length === 0 || !player.spitPilesFaceUp[pileIndex]) {
      return null;
    }

    return pile[pile.length - 1];
  }

  /**
   * Play a card from a spit pile to a center pile
   * Returns success/failure and updates game state
   */
  playCard(playerName, spitPileIndex, centerPileIndex) {
    if (this.gameOver) {
      throw new Error('Game is over');
    }

    if (!this.players[playerName]) {
      throw new Error('Invalid player');
    }

    const player = this.players[playerName];

    // Get the card to play
    const topCard = this.getTopSpitCard(playerName, spitPileIndex);
    if (!topCard) {
      throw new Error('Invalid card selection or pile is empty');
    }

    // Check if play is legal
    if (!this.isLegalPlay(topCard, centerPileIndex)) {
      throw new Error('Illegal play: card must be 1 rank higher or lower');
    }

    // Remove card from spit pile
    player.spitPiles[spitPileIndex].pop();
    player.handSize--;

    // Add card to center pile
    this.centerPiles[centerPileIndex].push(topCard);

    // Check if we need to flip a card
    this.flipNextCard(playerName, spitPileIndex);

    // Check if round is over
    const roundEnd = this.checkRoundEnd();

    return { success: true, roundEnd, winner: this.winner };
  }

  /**
   * Flip the next card in a spit pile if the current top is removed
   */
  flipNextCard(playerName, pileIndex) {
    const player = this.players[playerName];
    const pile = player.spitPiles[pileIndex];

    // If pile is empty, no card to flip
    if (pile.length === 0) {
      player.spitPilesFaceUp[pileIndex] = false;
      return;
    }

    // If there are cards left, they're now face-up
    player.spitPilesFaceUp[pileIndex] = true;
  }

  /**
   * Check if a player can make a legal move
   */
  canPlayerMove(playerName) {
    const player = this.players[playerName];

    // Check each spit pile
    for (let pileIdx = 0; pileIdx < 5; pileIdx++) {
      const topCard = this.getTopSpitCard(playerName, pileIdx);
      if (!topCard) continue;

      // Check if this card can play on either center pile
      for (let centerIdx = 0; centerIdx < 2; centerIdx++) {
        if (this.isLegalPlay(topCard, centerIdx)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handle stalemate: both players flip top card from stock and create new center piles
   */
  resolveStalemate() {
    const p1 = this.players[this.player1Name];
    const p2 = this.players[this.player2Name];

    // Both flip from stock
    const p1Card = p1.stockPile.pop();
    const p2Card = p2.stockPile.pop();

    if (p1Card) {
      p1.handSize--;
      this.centerPiles[0] = [p1Card];
    }
    if (p2Card) {
      p2.handSize--;
      this.centerPiles[1] = [p2Card];
    }

    // If one or both players are out of stock cards, they can't flip
    // Game continues but may become unplayable (draw condition)
    return {
      centerPiles: [...this.centerPiles],
      stalemateResolved: true,
    };
  }

  /**
   * Check if a player has won: no cards in stock AND all spit piles empty
   */
  hasWon(playerName) {
    const player = this.players[playerName];
    const noStock = player.stockPile.length === 0;
    const noSpitPiles = player.spitPiles.every(pile => pile.length === 0);
    return noStock && noSpitPiles;
  }

  /**
   * Check if a round is over: first player to have all spit piles empty wins the round
   */
  checkRoundEnd() {
    const p1 = this.players[this.player1Name];
    const p2 = this.players[this.player2Name];

    // Check if player 1 has all spit piles empty
    const p1Empty = p1.spitPiles.every(pile => pile.length === 0);
    if (p1Empty) {
      this.roundOver = true;
      return { eliminated: this.player1Name };
    }

    // Check if player 2 has all spit piles empty
    const p2Empty = p2.spitPiles.every(pile => pile.length === 0);
    if (p2Empty) {
      this.roundOver = true;
      return { eliminated: this.player2Name };
    }

    return null;
  }

  /**
   * Handle end of round: give smaller center pile to eliminated player, reshuffle, redeal for next round
   */
  endRound(eliminatedPlayer) {
    const p1 = this.players[this.player1Name];
    const p2 = this.players[this.player2Name];
    const otherPlayer = eliminatedPlayer === this.player1Name ? this.player2Name : this.player1Name;

    // Determine which center pile is smaller
    const pile1Size = this.centerPiles[0].length;
    const pile2Size = this.centerPiles[1].length;
    const smallerPile = pile1Size <= pile2Size ? this.centerPiles[0] : this.centerPiles[1];
    const largerPile = pile1Size <= pile2Size ? this.centerPiles[1] : this.centerPiles[0];

    // Build next-round decks per player: winner (eliminated) gets smaller pile, opponent gets larger
    const eliminatedObj = this.players[eliminatedPlayer];
    const otherObj = this.players[otherPlayer];

    const eliminatedNextDeck = [];
    const otherNextDeck = [];

    // Add current holdings
    eliminatedObj.spitPiles.forEach(pile => pile.forEach(card => eliminatedNextDeck.push(card)));
    eliminatedObj.stockPile.forEach(card => eliminatedNextDeck.push(card));
    otherObj.spitPiles.forEach(pile => pile.forEach(card => otherNextDeck.push(card)));
    otherObj.stockPile.forEach(card => otherNextDeck.push(card));

    // Add center piles accordingly
    smallerPile.forEach(card => eliminatedNextDeck.push(card));
    largerPile.forEach(card => otherNextDeck.push(card));

    console.log(`Round ${this.round}: ${eliminatedPlayer} eliminated. Next decks => ${eliminatedPlayer}: ${eliminatedNextDeck.length}, ${otherPlayer}: ${otherNextDeck.length}`);

    // Check if game is over: if one player has 0 cards for next round
    if (eliminatedNextDeck.length === 0 || otherNextDeck.length === 0) {
      this.gameOver = true;
      this.winner = eliminatedNextDeck.length === 0 ? otherPlayer : eliminatedPlayer;
      return { gameOver: true, winner: this.winner };
    }

    // Shuffle decks independently
    const shuffleInPlace = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    shuffleInPlace(eliminatedNextDeck);
    shuffleInPlace(otherNextDeck);

    // Reset for new round
    this.round++;
    this.roundOver = false;
    this.centerPiles = [[], []];

    // Reset player hands
    p1.spitPiles = [[], [], [], [], []];
    p1.spitPilesFaceUp = [false, false, false, false, false];
    p1.stockPile = [];
    p1.handSize = 0;
    p2.spitPiles = [[], [], [], [], []];
    p2.spitPilesFaceUp = [false, false, false, false, false];
    p2.stockPile = [];
    p2.handSize = 0;

    // Deal next-round decks according to uneven sizes
    this.dealPlayerCards(eliminatedPlayer, eliminatedNextDeck);
    this.dealPlayerCards(otherPlayer, otherNextDeck);

    // Initialize new center piles
    const p1TopStock = this.players[this.player1Name].stockPile.pop();
    const p2TopStock = this.players[this.player2Name].stockPile.pop();

    if (p1TopStock) {
      this.centerPiles[0].push(p1TopStock);
      this.players[this.player1Name].handSize--;
    }
    if (p2TopStock) {
      this.centerPiles[1].push(p2TopStock);
      this.players[this.player2Name].handSize--;
    }

    return { gameOver: false, newRound: this.round };
  }

  /**
   * Check win condition (kept for compatibility, now only used after game over)
   */
  checkWinCondition() {
    // Game over is now determined by endRound when all cards are gone
    return false;
  }

  /**
   * Get current game state for broadcasting to clients
   */
  getGameState() {
    const p1 = this.players[this.player1Name];
    const p2 = this.players[this.player2Name];

    return {
      player1: {
        name: this.player1Name,
        spitPiles: this.getSpitPilesState(this.player1Name),
        stockPileCount: p1.stockPile.length,
        totalCards: p1.handSize,
      },
      player2: {
        name: this.player2Name,
        spitPiles: this.getSpitPilesState(this.player2Name),
        stockPileCount: p2.stockPile.length,
        totalCards: p2.handSize,
      },
      centerPiles: [
        {
          topCard: this.getTopCard(this.centerPiles[0]),
          length: this.centerPiles[0].length,
        },
        {
          topCard: this.getTopCard(this.centerPiles[1]),
          length: this.centerPiles[1].length,
        },
      ],
      gameOver: this.gameOver,
      winner: this.winner,
      round: this.round,
    };
  }

  /**
   * Execute spit: flip cards from stock pile(s) to center piles
   * If both players have stock: each player flips 1 card to each center pile
   * If only one player has stock: that player flips 2 cards from their stock
   */
  executeSpit() {
    const p1 = this.players[this.player1Name];
    const p2 = this.players[this.player2Name];

    const p1HasStock = p1.stockPile.length > 0;
    const p2HasStock = p2.stockPile.length > 0;

    // If neither player has stock, cannot spit
    if (!p1HasStock && !p2HasStock) {
      throw new Error('Cannot spit: both players have no stock cards');
    }

    // Case 1: Both players have stock - each flips one card
    if (p1HasStock && p2HasStock) {
      const p1Card = p1.stockPile.pop();
      const p2Card = p2.stockPile.pop();

      this.centerPiles[0].push(p1Card);
      this.centerPiles[1].push(p2Card);

      p1.handSize--;
      p2.handSize--;

      console.log(`Spit executed: ${p1Card.rank} of ${p1Card.suit} and ${p2Card.rank} of ${p2Card.suit} dealt to center`);
    }
    // Case 2: Only one player has stock - they flip 2 cards
    else if (p1HasStock && !p2HasStock) {
      // Player 1 has stock, player 2 doesn't - p1 flips 2 cards
      if (p1.stockPile.length < 2) {
        throw new Error('Not enough stock cards to spit');
      }
      const card1 = p1.stockPile.pop();
      const card2 = p1.stockPile.pop();

      this.centerPiles[0].push(card1);
      this.centerPiles[1].push(card2);

      p1.handSize -= 2;

      console.log(`Spit executed (solo): ${this.player1Name} flipped ${card1.rank} and ${card2.rank} to center`);
    }
    else if (p2HasStock && !p1HasStock) {
      // Player 2 has stock, player 1 doesn't - p2 flips 2 cards
      if (p2.stockPile.length < 2) {
        throw new Error('Not enough stock cards to spit');
      }
      const card1 = p2.stockPile.pop();
      const card2 = p2.stockPile.pop();

      this.centerPiles[0].push(card1);
      this.centerPiles[1].push(card2);

      p2.handSize -= 2;

      console.log(`Spit executed (solo): ${this.player2Name} flipped ${card1.rank} and ${card2.rank} to center`);
    }
  }

  /**
   * Get the state of spit piles for a player (top card visible, counts for hidden)
   */
  getSpitPilesState(playerName) {
    const player = this.players[playerName];
    return player.spitPiles.map((pile, idx) => ({
      index: idx,
      topCard: player.spitPilesFaceUp[idx] && pile.length > 0 ? pile[pile.length - 1] : null,
      totalCards: pile.length,
      faceUp: player.spitPilesFaceUp[idx],
    }));
  }

  /**
   * Get the top card of a pile (or null if empty)
   */
  getTopCard(pile) {
    if (!pile || pile.length === 0) return null;
    return pile[pile.length - 1];
  }

  /**
   * Check if the game is in stalemate (no legal moves for either player)
   */
  isStalemate() {
    return !this.canPlayerMove(this.player1Name) && !this.canPlayerMove(this.player2Name);
  }

  /**
   * Get all valid moves for a player (for UI or AI)
   */
  getValidMoves(playerName) {
    const player = this.players[playerName];
    const moves = [];

    for (let pileIdx = 0; pileIdx < 5; pileIdx++) {
      const topCard = this.getTopSpitCard(playerName, pileIdx);
      if (!topCard) continue;

      for (let centerIdx = 0; centerIdx < 2; centerIdx++) {
        if (this.isLegalPlay(topCard, centerIdx)) {
          moves.push({
            spitPileIndex: pileIdx,
            centerPileIndex: centerIdx,
            card: topCard,
          });
        }
      }
    }

    return moves;
  }

  /**
   * Check if a player has stock cards
   */
  hasStock(playerName) {
    const player = this.players[playerName];
    return player && player.stockPile.length > 0;
  }

  /**
   * Check if a player can spit (has at least 1 or 2 stock cards depending on situation)
   */
  canSpit(playerName) {
    const player = this.players[playerName];
    if (!player) return false;

    const otherPlayerName = playerName === this.player1Name ? this.player2Name : this.player1Name;
    const otherPlayer = this.players[otherPlayerName];

    // If opponent has stock, need at least 1 card to spit
    if (otherPlayer.stockPile.length > 0) {
      return player.stockPile.length >= 1;
    }

    // If opponent has no stock, need at least 2 cards to spit alone
    return player.stockPile.length >= 2;
  }
}

export default SpitGame;
