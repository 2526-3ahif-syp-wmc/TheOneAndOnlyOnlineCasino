export type User = {
  id: number;
  username: string;
  password: string;
  premium: number;
  coins: number;
  wins: number;
  losses: number;
  xp: number;
};

export type ProfileUserRow = User & {
  password: string;
};