import { db } from "../databases/db";
import { Unit } from "../unit";
import {
  BlackjackCard,
  BlackjackGame,
  BlackjackGameRow,
  BlackjackGameStatus,
} from "../models/blackjack-model";

const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export function getBlackjackGameById(gameId: number): BlackjackGame | undefined {
  const unit = new Unit(false);

  try {
    const row = unit.db
      .prepare(
        `
        SELECT id, user_id, bet, status, player_hand, dealer_hand
        FROM blackjack_games
        WHERE id = ?
      `,
      )
      .get(gameId) as BlackjackGameRow | undefined;

    return row ? toGame(row) : undefined;
  } finally {
    unit.close();
  }
}

export function startGame(userId: number, bet: number): BlackjackGame | undefined {
  const unit = new Unit(false);

  try {
    const user = unit.db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE id = ?
      `,
      )
      .get(userId) as { id: number } | undefined;

    if (!user || !Number.isInteger(bet) || bet <= 0) {
      return undefined;
    }

    const deck = createDeck();
    const playerHand = [drawCard(deck), drawCard(deck)];
    const dealerHand = [drawCard(deck), drawCard(deck)];

    const playerScore = getHandScore(playerHand);
    const dealerScore = getHandScore(dealerHand);

    const status = getInitialStatus(playerScore, dealerScore);

    const result = unit.db
      .prepare(
        `
        INSERT INTO blackjack_games (user_id, bet, status, player_hand, dealer_hand)
        VALUES (?, ?, ?, ?, ?)
      `,
      )
      .run(userId, bet, status, JSON.stringify(playerHand), JSON.stringify(dealerHand));

    return getBlackjackGameById(Number(result.lastInsertRowid));
  } finally {
    unit.close();
  }
}

export function hit(gameId: number): BlackjackGame | undefined {
  const unit = new Unit(false);

  try {
    const game = readGame(unit, gameId);

    if (!game || game.status !== "playing") {
      return undefined;
    }

    const deck = createDeck();
    const playerHand = [...game.playerHand, drawCard(deck)];
    const playerScore = getHandScore(playerHand);

    const status: BlackjackGameStatus = playerScore > 21 ? "player_bust" : "playing";

    updateGame(unit, gameId, status, playerHand, game.dealerHand);

    return getBlackjackGameById(gameId);
  } finally {
    unit.close();
  }
}

export function stand(gameId: number): BlackjackGame | undefined {
  const unit = new Unit(false);

  try {
    const game = readGame(unit, gameId);

    if (!game || game.status !== "playing") {
      return undefined;
    }

    const deck = createDeck();
    const playerScore = getHandScore(game.playerHand);
    const dealerHand = [...game.dealerHand];
    let dealerScore = getHandScore(dealerHand);

    while (dealerScore < 17) {
      dealerHand.push(drawCard(deck));
      dealerScore = getHandScore(dealerHand);
    }

    const status = decideWinner(playerScore, dealerScore);

    updateGame(unit, gameId, status, game.playerHand, dealerHand);

    return getBlackjackGameById(gameId);
  } finally {
    unit.close();
  }
}

function readGame(unit: Unit, gameId: number): BlackjackGame | undefined {
  const row = unit.db
    .prepare(
      `
      SELECT id, user_id, bet, status, player_hand, dealer_hand
      FROM blackjack_games
      WHERE id = ?
    `,
    )
    .get(gameId) as BlackjackGameRow | undefined;

  return row ? toGame(row) : undefined;
}

function updateGame(
  unit: Unit,
  gameId: number,
  status: BlackjackGameStatus,
  playerHand: BlackjackCard[],
  dealerHand: BlackjackCard[],
): void {
  unit.db
    .prepare(
      `
      UPDATE blackjack_games
      SET status = ?, player_hand = ?, dealer_hand = ?
      WHERE id = ?
    `,
    )
    .run(status, JSON.stringify(playerHand), JSON.stringify(dealerHand), gameId);
}

function createDeck(): BlackjackCard[] {
  const deck: BlackjackCard[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: getCardValue(rank),
      });
    }
  }

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
  }

  return deck;
}

function drawCard(deck: BlackjackCard[]): BlackjackCard {
  const card = deck.pop();

  if (!card) {
    throw new Error("Deck is empty");
  }

  return card;
}

function getCardValue(rank: BlackjackCard["rank"]): number {
  if (rank === "A") {
    return 11;
  }

  if (rank === "J" || rank === "Q" || rank === "K") {
    return 10;
  }

  return Number(rank);
}

function getHandScore(hand: BlackjackCard[]): number {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    score += card.value;

    if (card.rank === "A") {
      aces += 1;
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
}

function getInitialStatus(playerScore: number, dealerScore: number): BlackjackGameStatus {
  if (playerScore === 21 && dealerScore === 21) {
    return "push";
  }

  if (playerScore === 21) {
    return "player_win";
  }

  if (dealerScore === 21) {
    return "dealer_win";
  }

  return "playing";
}

function decideWinner(playerScore: number, dealerScore: number): BlackjackGameStatus {
  if (playerScore > 21) {
    return "player_bust";
  }

  if (dealerScore > 21) {
    return "dealer_bust";
  }

  if (playerScore > dealerScore) {
    return "player_win";
  }

  if (dealerScore > playerScore) {
    return "dealer_win";
  }

  return "push";
}

function toGame(row: BlackjackGameRow): BlackjackGame {
  return {
    id: row.id,
    userId: row.user_id,
    bet: row.bet,
    status: row.status,
    playerHand: JSON.parse(row.player_hand) as BlackjackCard[],
    dealerHand: JSON.parse(row.dealer_hand) as BlackjackCard[],
  };
}
