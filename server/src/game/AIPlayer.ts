import { Card, AttackPair, Suit } from '../types';
import { canBeat, RANK_VALUES, getCardValue } from './CardDeck';

export class AIPlayer {
  constructor(private difficulty: number) {}

  private isOptimal(): boolean {
    return Math.random() * 100 < this.difficulty;
  }

  chooseAttackCard(hand: Card[], table: AttackPair[], trumpSuit: Suit): Card | null {
    if (hand.length === 0) return null;

    let legal: Card[];

    if (table.length === 0) {
      legal = [...hand];
    } else {
      const tableRanks = new Set(
        table.flatMap(p => [p.attack.rank, p.defense?.rank]).filter(Boolean)
      );
      legal = hand.filter(c => tableRanks.has(c.rank));
    }

    if (legal.length === 0) return null;

    if (this.isOptimal()) {
      // Play lowest non-trump first, save trumps
      const nonTrump = legal.filter(c => c.suit !== trumpSuit);
      const pool = nonTrump.length > 0 ? nonTrump : legal;
      return pool.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank])[0];
    } else {
      return legal[Math.floor(Math.random() * legal.length)];
    }
  }

  chooseDefenseCard(hand: Card[], attackCard: Card, trumpSuit: Suit): Card | null {
    const beaters = hand.filter(c => canBeat(attackCard, c, trumpSuit));
    if (beaters.length === 0) return null;

    if (this.isOptimal()) {
      // Use smallest valid beater, prefer non-trump
      const nonTrumpBeaters = beaters.filter(c => c.suit !== trumpSuit);
      const pool = nonTrumpBeaters.length > 0 ? nonTrumpBeaters : beaters;
      return pool.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank])[0];
    } else {
      return beaters[Math.floor(Math.random() * beaters.length)];
    }
  }

  shouldTake(hand: Card[], table: AttackPair[], trumpSuit: Suit): boolean {
    const undefended = table.filter(p => !p.defense);
    const canDefendAll = undefended.every(p =>
      hand.some(c => canBeat(p.attack, c, trumpSuit))
    );

    if (!canDefendAll) return true;

    if (this.isOptimal()) {
      // Take only if defending would cost a trump and we have few
      const trumpCount = hand.filter(c => c.suit === trumpSuit).length;
      const wouldCostTrump = undefended.some(p => {
        const nonTrumpBeaters = hand.filter(
          c => c.suit !== trumpSuit && canBeat(p.attack, c, trumpSuit)
        );
        return nonTrumpBeaters.length === 0;
      });
      return wouldCostTrump && trumpCount <= 1 && hand.length > 4;
    } else {
      return Math.random() < 0.2;
    }
  }

  shouldPassAttack(hand: Card[], table: AttackPair[], defenderCardCount: number): boolean {
    const tableRanks = new Set(
      table.flatMap(p => [p.attack.rank, p.defense?.rank]).filter(Boolean)
    );
    const canAdd = hand.some(c => tableRanks.has(c.rank));

    if (!canAdd) return true;

    if (this.isOptimal()) {
      // Pass if defender has few cards (to let them run out)
      return defenderCardCount <= 3;
    } else {
      return Math.random() < 0.5;
    }
  }

  setDifficulty(d: number) {
    this.difficulty = Math.max(0, Math.min(100, d));
  }
}
