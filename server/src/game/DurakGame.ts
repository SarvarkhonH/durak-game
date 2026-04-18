import { v4 as uuidv4 } from 'uuid';
import { Card, AttackPair, GamePhase, GameState, Suit } from '../types';
import { createDeck, shuffleDeck, canBeat, RANK_VALUES } from './CardDeck';

interface InternalState {
  id: string;
  phase: GamePhase;
  deck: Card[];
  trumpCard: Card;
  trumpSuit: Suit;
  table: AttackPair[];
  hands: Map<string, Card[]>;
  attackerId: string;
  defenderId: string;
  loser?: string;
  winner?: string;
  bet: number;
  moves: number;
  startTime: number;
}

export class DurakGame {
  private state: InternalState;

  constructor(playerIds: string[], bet: number) {
    this.state = this.init(playerIds, bet);
  }

  private init(playerIds: string[], bet: number): InternalState {
    const deck = shuffleDeck(createDeck());
    const trumpCard = deck[deck.length - 1];
    const trumpSuit = trumpCard.suit;
    const hands = new Map<string, Card[]>();

    for (const id of playerIds) {
      hands.set(id, deck.splice(0, 6));
    }

    // First attacker: player with lowest trump card
    let attackerIdx = 0;
    let lowestTrumpVal = Infinity;
    for (let i = 0; i < playerIds.length; i++) {
      const trumpCards = hands.get(playerIds[i])!.filter(c => c.suit === trumpSuit);
      for (const c of trumpCards) {
        if (RANK_VALUES[c.rank] < lowestTrumpVal) {
          lowestTrumpVal = RANK_VALUES[c.rank];
          attackerIdx = i;
        }
      }
    }

    const defenderIdx = (attackerIdx + 1) % playerIds.length;

    return {
      id: uuidv4(),
      phase: 'attack',
      deck,
      trumpCard,
      trumpSuit,
      table: [],
      hands,
      attackerId: playerIds[attackerIdx],
      defenderId: playerIds[defenderIdx],
      bet,
      moves: 0,
      startTime: Date.now(),
    };
  }

  attack(playerId: string, cardId: string): { ok: boolean; error?: string } {
    if (this.state.phase !== 'attack') return { ok: false, error: 'Not attack phase' };
    if (playerId !== this.state.attackerId) return { ok: false, error: 'Not your turn' };

    const hand = this.state.hands.get(playerId)!;
    const card = hand.find(c => c.id === cardId);
    if (!card) return { ok: false, error: 'Card not in hand' };

    if (this.state.table.length > 0) {
      const tableRanks = new Set(
        this.state.table.flatMap(p => [p.attack.rank, p.defense?.rank]).filter(Boolean)
      );
      if (!tableRanks.has(card.rank)) return { ok: false, error: 'Rank not on table' };
    }

    // Can't attack with more cards than defender has
    const defHand = this.state.hands.get(this.state.defenderId)!;
    const unbeaten = this.state.table.filter(p => !p.defense).length;
    if (unbeaten + 1 > defHand.length) return { ok: false, error: 'Too many cards' };

    hand.splice(hand.indexOf(card), 1);
    this.state.table.push({ attack: card });
    this.state.phase = 'defend';
    this.state.moves++;
    return { ok: true };
  }

  defend(playerId: string, cardId: string, targetId: string): { ok: boolean; error?: string } {
    if (this.state.phase !== 'defend') return { ok: false, error: 'Not defend phase' };
    if (playerId !== this.state.defenderId) return { ok: false, error: 'Not your turn' };

    const hand = this.state.hands.get(playerId)!;
    const card = hand.find(c => c.id === cardId);
    if (!card) return { ok: false, error: 'Card not in hand' };

    const pair = this.state.table.find(p => p.attack.id === targetId && !p.defense);
    if (!pair) return { ok: false, error: 'Target not found or already beaten' };

    if (!canBeat(pair.attack, card, this.state.trumpSuit)) {
      return { ok: false, error: 'Cannot beat that card' };
    }

    hand.splice(hand.indexOf(card), 1);
    pair.defense = card;
    this.state.moves++;

    // If all pairs beaten, back to attack phase
    if (this.state.table.every(p => p.defense)) {
      this.state.phase = 'attack';
    }

    return { ok: true };
  }

  takeCards(playerId: string): { ok: boolean; error?: string } {
    if (playerId !== this.state.defenderId) return { ok: false, error: 'Not defender' };
    if (this.state.table.length === 0) return { ok: false, error: 'Nothing to take' };

    const hand = this.state.hands.get(playerId)!;
    for (const pair of this.state.table) {
      hand.push(pair.attack);
      if (pair.defense) hand.push(pair.defense);
    }
    this.state.table = [];
    this.state.moves++;

    // Attacker draws first
    this.drawCards([this.state.attackerId]);
    this.checkGameOver();
    if (this.state.phase !== 'finished') {
      this.state.phase = 'attack'; // same attacker
    }
    return { ok: true };
  }

  passAttack(playerId: string): { ok: boolean; error?: string } {
    if (playerId !== this.state.attackerId) return { ok: false, error: 'Not attacker' };
    if (this.state.table.some(p => !p.defense)) return { ok: false, error: 'Not all defended yet' };

    this.state.table = [];
    this.drawCards([this.state.attackerId, this.state.defenderId]);

    // Swap roles
    [this.state.attackerId, this.state.defenderId] = [this.state.defenderId, this.state.attackerId];
    this.state.moves++;

    this.checkGameOver();
    if (this.state.phase !== 'finished') {
      this.state.phase = 'attack';
    }
    return { ok: true };
  }

  private drawCards(order: string[]) {
    for (const id of order) {
      const hand = this.state.hands.get(id)!;
      while (hand.length < 6 && this.state.deck.length > 0) {
        hand.push(this.state.deck.shift()!);
      }
    }
  }

  private checkGameOver() {
    if (this.state.deck.length > 0) return;
    const withCards = [...this.state.hands.entries()].filter(([, h]) => h.length > 0);
    if (withCards.length <= 1) {
      this.state.loser = withCards[0]?.[0];
      const players = [...this.state.hands.keys()];
      this.state.winner = players.find(id => id !== this.state.loser);
      this.state.phase = 'finished';
    }
  }

  canAddMore(playerId: string): boolean {
    if (playerId !== this.state.attackerId) return false;
    if (this.state.table.length === 0) return false;
    const hand = this.state.hands.get(playerId)!;
    const tableRanks = new Set(
      this.state.table.flatMap(p => [p.attack.rank, p.defense?.rank]).filter(Boolean)
    );
    return hand.some(c => tableRanks.has(c.rank));
  }

  getPhase() { return this.state.phase; }
  getId() { return this.state.id; }
  getBet() { return this.state.bet; }
  getWinner() { return this.state.winner; }
  getLoser() { return this.state.loser; }
  getAttackerId() { return this.state.attackerId; }
  getDefenderId() { return this.state.defenderId; }
  getHand(id: string) { return this.state.hands.get(id) ?? []; }
  getDuration() { return Math.round((Date.now() - this.state.startTime) / 1000); }
  getMoves() { return this.state.moves; }

  getStateFor(playerId: string, playerNames: Map<string, string>): GameState {
    const players = [...this.state.hands.entries()].map(([id, hand]) => ({
      id,
      name: playerNames.get(id) ?? id,
      cardCount: hand.length,
      isAttacker: id === this.state.attackerId,
      isDefender: id === this.state.defenderId,
      isAI: id === 'ai',
      balance: 0,
    }));

    const canPass =
      this.state.phase === 'attack' &&
      playerId === this.state.attackerId &&
      this.state.table.length > 0 &&
      this.state.table.every(p => p.defense);

    return {
      id: this.state.id,
      phase: this.state.phase,
      trumpCard: this.state.trumpCard,
      trumpSuit: this.state.trumpSuit,
      deckCount: this.state.deck.length,
      table: this.state.table,
      players,
      myCards: this.state.hands.get(playerId) ?? [],
      myId: playerId,
      canPass,
      winner: this.state.winner,
      loser: this.state.loser,
      message: '',
      bet: this.state.bet,
    };
  }
}
