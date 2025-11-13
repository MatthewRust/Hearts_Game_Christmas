// Helper to build image URLs for cards using Vite's URL handling
// Accepts cards in the shape { rank: 'Queen', suit: 'Spades' }
// Also tolerates underscored props { _rank, _suit } as a fallback

const suitFolderMap = {
  Clubs: 'Clubs',
  Diamonds: 'Daimonds', // folder name is intentionally misspelled in repo
  Hearts: 'Hearts',
  Spades: 'Spades',
};

const suitLetterMap = { Clubs: 'C', Diamonds: 'D', Hearts: 'H', Spades: 'S' };
const rankAbbrev = (rank) => ({ Jack: 'J', Queen: 'Q', King: 'K', Ace: 'A' }[rank] || String(rank));

export function normalizeCard(card) {
  if (!card) return null;
  const rank = card.rank ?? card._rank;
  const suit = card.suit ?? card._suit;
  const value = card.value ?? card._value ?? 0;
  if (!rank || !suit) return null;
  return { rank, suit, value };
}

export function cardImageUrl(card) {
  const c = normalizeCard(card);
  if (!c) {
    return new URL('../card/Back.png', import.meta.url).href;
  }
  const abbrev = `${rankAbbrev(c.rank)}${suitLetterMap[c.suit]}`;
  const folder = suitFolderMap[c.suit];
  if (!folder) return new URL('../card/Back.png', import.meta.url).href;
  // Path from src/utils/... to src/card/... is ../card
  return new URL(`../card/${folder}/${abbrev}.png`, import.meta.url).href;
}
