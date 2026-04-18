import { Card, Suit, Rank } from '../types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}_${rank}`, suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function canBeat(attack: Card, defense: Card, trumpSuit: Suit): boolean {
  if (defense.suit === attack.suit) {
    return RANK_VALUES[defense.rank] > RANK_VALUES[attack.rank];
  }
  if (defense.suit === trumpSuit && attack.suit !== trumpSuit) {
    return true;
  }
  return false;
}

export function getCardValue(card: Card, trumpSuit: Suit): number {
  const base = RANK_VALUES[card.rank];
  return card.suit === trumpSuit ? base + 100 : base;
}
