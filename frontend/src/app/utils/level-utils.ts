export function getLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function getXpForNextLevel(level: number): number {
  return Math.pow(level, 2) * 100;
}

export function getXpPercent(xpProgress: number, xpNeeded: number): number {
  if (xpNeeded <= 0) {
    return 100;
  }

  return Math.min(100, Math.round((xpProgress / xpNeeded) * 100));
}
