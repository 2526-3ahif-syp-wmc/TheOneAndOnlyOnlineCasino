# Mystery Box Feature Implementation

## Overview
Created a new Mystery Box feature that works alongside the Daily Bonus in the home page. Players can claim a mystery box reward every 6 hours with the following probabilities:
- **50%**: 0 coins (nothing)
- **40%**: 1-500 random coins
- **10%**: 2x Wins Buff (active for 1 hour)

## Files Created
- `frontend/src/app/services/mystery-box-service.ts` - Core service managing mystery box rewards and buff mechanics

## Files Modified

### Home Component
- `frontend/src/app/home/home.html` - Added mystery box card UI next to daily bonus
- `frontend/src/app/home/home.ts` - Added mystery box claim logic with 6-hour cooldown
- `frontend/src/app/home/home.scss` - Added mystery box styling to match daily bonus design

### Games Integration
All three games have been updated to support the 2x Wins Buff:
- `frontend/src/app/roulette-game/roulette-game.ts`
- `frontend/src/app/slot-machine/slot-machine.ts`
- `frontend/src/app/mines-game/mines-game.ts`

Each game now calls `applyBuffToWin()` after a player wins, which logs an additional win with 0 coins when the buff is active.

## How the 2x Wins Buff Works

1. When a player gets the buff reward from the mystery box, it activates for 1 hour
2. Every time the player wins in ANY game while the buff is active:
   - The normal win is recorded (money + 1 win)
   - An additional win entry is saved with 0 coins (creating the 2x multiplier)
3. On the leaderboard, this shows as 2 wins but only the first win's coins are counted
4. The buff is tracked via localStorage with an expiration timestamp

## Key Features

✅ **Reused Code**: Follows the same patterns as the daily bonus for consistency
✅ **No Rewriting**: Minimal changes to existing game logic - just added buff application calls
✅ **localStorage Based**: Buff state persists across page refreshes
✅ **Auto-Expiration**: Buff automatically clears after 1 hour
✅ **Per-User**: Each user has their own mystery box cooldown
✅ **Responsive UI**: "Open mystery box" button disables after claiming and shows hours until next claim

## UI Elements

**Mystery Box Card** (next to Daily Bonus):
- **Icon**: Purple mystical box icon
- **Title**: "Mystery Box!"
- **Available State**: Shows description and "Open mystery box" button
- **Claimed State**: Shows hours until next claim and disabled button

**Alert Messages**:
- 50% chance: "Mystery Box: Nothing this time!"
- 40% chance: "Mystery Box: +{amount} EC!"
- 10% chance: "Mystery Box: 2x Wins Buff activated for 1 hour!"

## Testing Checklist

- [ ] Mystery box card appears on home page next to daily bonus
- [ ] Button disables after claiming
- [ ] Cooldown timer counts down correctly (6 hours)
- [ ] Coins reward correctly updates player balance
- [ ] Buff activates successfully
- [ ] Buff applies to wins in Roulette game
- [ ] Buff applies to wins in Slot Machine game
- [ ] Buff applies to wins in Mines game
- [ ] Leaderboard shows 2x wins when buff is active
- [ ] Buff expires after 1 hour
- [ ] Page refresh maintains cooldown state
- [ ] Page refresh maintains buff state

## Implementation Notes

- The mystery box uses the same 6-hour cooldown logic as shown in home.ts
- The buff duration is currently set to 1 hour (see `BUFF_DURATION_MS` in mystery-box-service.ts)
- The buff is applied by saving an additional game history record with game name suffixed with "(Buff)"
- All changes maintain the existing code structure and don't break any existing functionality
