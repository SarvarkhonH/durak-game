export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface AttackPair {
  attack: Card;
  defense?: Card;
}

export type GamePhase = 'attack' | 'defend' | 'finished';
export type GameMode = 'classic' | 'transfer';

export interface PlayerState {
  id: string;
  name: string;
  cardCount: number;
  isAttacker: boolean;
  isDefender: boolean;
  isAI: boolean;
  balance: number;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  trumpCard: Card;
  trumpSuit: Suit;
  deckCount: number;
  bitoCount: number;
  table: AttackPair[];
  players: PlayerState[];
  myCards: Card[];
  myId: string;
  canPass: boolean;
  canTransfer: boolean;
  gameMode: GameMode;
  winner?: string;
  loser?: string;
  message: string;
  bet: number;
}

export interface PlayerData {
  id: string;
  name: string;
  balance: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
}

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_COLOR: Record<Suit, string> = {
  spades: 'black',
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
};
