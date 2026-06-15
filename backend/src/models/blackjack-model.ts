export type BlackjackCardSuit = "hearts" | "diamonds" | "clubs" | "spades";

export type BlackjackCardRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type BlackjackGameStatus =
  | "playing"
  | "player_bust"
  | "dealer_bust"
  | "player_win"
  | "dealer_win"
  | "push";

export type BlackjackCard = {
  suit: BlackjackCardSuit;
  rank: BlackjackCardRank;
  value: number;
};

export type BlackjackGame = {
  id: number;
  userId: number;
  bet: number;
  status: BlackjackGameStatus;
  playerHand: BlackjackCard[];
  dealerHand: BlackjackCard[];
};

export type BlackjackGameRow = {
  id: number;
  user_id: number;
  bet: number;
  status: BlackjackGameStatus;
  player_hand: string;
  dealer_hand: string;
};
