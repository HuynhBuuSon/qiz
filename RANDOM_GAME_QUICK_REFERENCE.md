# Random Game Quick Reference

## Game Workflow

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: SETTINGS (Admin Configuration)                  │
├─────────────────────────────────────────────────────────┤
│ • Enter Point Award (0 = no points)                     │
│ • Toggle IsRepeat (repeat = same player multiple times) │
│ • Click START GAME                                      │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: SPINNING (Random Selection)                     │
├─────────────────────────────────────────────────────────┤
│ • Click SPIN button                                     │
│ • Spinner animates (2 seconds)                          │
│ • Random player selected                                │
│ • Already-won players blurred if IsRepeat=false         │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: ACTIONS (Admin Decision)                        │
├─────────────────────────────────────────────────────────┤
│ Choose one action for selected player:                  │
│                                                         │
│  🏆 REWARD        → +pointAward points                 │
│  🚫 DO NOTHING    → 0 points                           │
│  ⚠️ PUNISH        → -pointAward points                 │
│                                                         │
│ • Score updates immediately                            │
│ • Auto-continues to next spin (1.5s)                   │
└──────────────────────┬──────────────────────────────────┘
                       ↓
│   ← Repeat STEP 2-3 until game ends →
│
│           (Admin can keep spinning)
│                       ↓
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: END GAME (Finalization)                         │
├─────────────────────────────────────────────────────────┤
│ • Click FINALIZE GAME                                   │
│ • Game status → completed                               │
│ • Rankings calculated from final scores                │
│ • All changes saved to database                         │
│ • Real-time updates propagate to all screens            │
└─────────────────────────────────────────────────────────┘
```

## Admin Control Panel

### Settings Screen
```
Point Award: [10] ← Enter number (0 = no award)
✓ Allow player repeat? ← Check to allow repeats
[▶️ START GAME] ← Begin game
```

### Spinning Screen
```
┌──────────────┬──────────────┬──────────────┐
│ 👥 PLAYERS   │ 🎡 SPINNER   │ 🎉 SELECTED  │
├──────────────┼──────────────┼──────────────┤
│ P01 Alice    │   ↻   ↻   ↻  │ P03 Charlie  │
│ P02 Bob      │   ↻ 🎡 ↻     │ Points: 20   │
│ P03 Charlie✓ │   ↻   ↻   ↻  │              │
│              │              │              │
│ (blurred=won)│ [🎡 SPIN]   │              │
└──────────────┴──────────────┴──────────────┘
```

### Actions Screen
```
Selected: P03 - Charlie
Current Points: 20

[🏆 REWARD +10] [🚫 DO NOTHING 0] [⚠️ PUNISH -10]

Auto-continues in 1.5s...
```

### End Game Screen
```
✅ Game Ended
Final rankings have been calculated.

[✅ FINALIZE GAME] ← Save everything
```

## Real-Time Updates

| Event | Trigger | Update |
|-------|---------|--------|
| Player Selected | Spin completes | All screens highlight player |
| Score Updated | Admin action | Real-time score change visible |
| Player List | Every 2s | Available players refreshed |
| Game Ended | Finalize button | Rankings updated across all screens |

## Player ID Format

- Format: **PXX** (P01, P02, P03... P99)
- Based on: Join order (sequence_number)
- Display: Shows on all players in spinner
- Usage: Identifies player without using random UUID

## Settings Examples

### Example 1: Tournament
```
Point Award: 100
IsRepeat: false
Result: 1 point per person, no one selected twice
```

### Example 2: Trivia
```
Point Award: 50
IsRepeat: true
Result: Points cumulative, same person can win multiple times
```

### Example 3: Punishment Game
```
Point Award: -5
IsRepeat: false
Result: Negative points for losing, each person once
```

### Example 4: No Scoring
```
Point Award: 0
IsRepeat: true
Result: Game progresses without score changes
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Settings not saving | Check network, wait for API response |
| Same player keeps appearing | Check IsRepeat setting (should be false) |
| No points awarded | Check pointAward value (might be 0) |
| Spinner won't animate | Wait for previous spin to complete (2s) |
| Game won't end | Wait for all actions to complete, check for errors |
| Scores not updating | Refresh page to sync with database |

## Keyboard Shortcuts

| Action | Method |
|--------|--------|
| Start Game | Click [▶️ START GAME] button |
| Spin | Click [🎡 SPIN] button |
| Reward | Click [🏆 REWARD] button |
| Punish | Click [⚠️ PUNISH] button |
| Nothing | Click [🚫 DO NOTHING] button |
| End Game | Click [✅ FINALIZE GAME] button |

## Player Perspective

During random game:
- See themselves highlighted when selected
- Watch score update in real-time
- See rank change after admin action
- See all other players' scores on presenter display

## Presenter Perspective

During random game:
- See all players in 4-column grid
- Watch selected player highlighted
- See real-time score updates
- Display for audience projection

## Data Flow

```
Admin Input (Settings)
↓
Game Config Saved → Database
↓
Spin Generated → Random Algorithm
↓
Player Selected → Highlighted on all screens
↓
Admin Action → Score Updated → Database
↓
Results Saved → Rankings Calculated
↓
All Screens Sync → Real-time updates
```

## Performance Tips

1. **Faster Spins**: Keep pointAward reasonable (< 1000)
2. **Smoother Animation**: Keep browser window focused
3. **Better Sync**: Ensure stable internet connection
4. **Less Load**: Use IsRepeat=false for limited players
5. **Testing**: Use pointAward=10 for easy testing

## Debugging Commands

Check game status:
```
GET /api/rooms/:roomId/games/:gameId
→ Check status, config fields
```

Check player scores:
```
GET /api/rooms/:roomId/players
→ Check score and rank fields
```

Check winners:
```
GET /api/rooms/:roomId/games/:gameId/random/winners
→ Check admin_action and points_awarded
```

## Success Indicators

✅ Game loads without errors
✅ Settings persist when saved
✅ Spinner animates smoothly
✅ Player selection is random
✅ Scores update immediately
✅ Admin can take actions
✅ Auto-continue works
✅ Game finalizes successfully
✅ Rankings calculated correctly
✅ All screens update in sync
