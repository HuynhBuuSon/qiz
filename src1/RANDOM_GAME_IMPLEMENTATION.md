# Random Game Implementation - Complete Guide

## Overview

The Random Game is a fully implemented game where the admin uses a spinning wheel to randomly select players and award/punish points based on admin decisions.

## Game Flow

### Step 1: Settings Configuration
- **Point Award**: Admin enters the number of points to award per spin (can be 0)
- **IsRepeat Checkbox**: Determines if players can be selected multiple times
  - If unchecked: Each player can only be selected once per game
  - If checked: Players can be selected multiple times

### Step 2: Spinning (Pick Phase)
- Admin clicks **SPIN** button
- Spinner animates with a wheel rotating effect (2 seconds)
- The wheel randomly selects one player from available players
  - If IsRepeat = false: Already-won players are excluded (shown as blurred/strikethrough)
  - If IsRepeat = true: All players available for selection
- Selected player is highlighted in the right panel

### Step 3: Admin Decision (Actions Phase)
Three admin control buttons appear for the selected player:

1. **🏆 REWARD** - Add points
   - Adds `pointAward` points to player's score
   - Example: If pointAward=10, adds +10 points

2. **🚫 DO NOTHING** - No change
   - Player receives 0 points
   - No score change

3. **⚠️ PUNISH** - Remove points
   - Subtracts `pointAward` points from player's score
   - Example: If pointAward=10, adds -10 points

After admin selects an action:
- Player's score updates immediately
- Winner record is saved to database
- Auto-continues to next spin after 1.5 seconds

### Step 4: Game Ended
- Admin clicks **Finalize Game**
- Game status changes to `completed`
- All player scores are calculated
- Rankings are auto-calculated based on final scores
- Game results are saved to database

## Component Features

### UI Components

#### Settings Panel (Step 1)
```
┌─────────────────────────────────────┐
│    Step 1: Game Settings            │
├─────────────────────────────────────┤
│ 🏆 Points to Award (per spin): [10] │
│ 🔄 Allow player repeat: [✓]         │
│ ▶️ START GAME                       │
└─────────────────────────────────────┘
```

#### Spinning Panel (Step 2)
```
┌───────────────────────────────────────────────────────┐
│              Step 2: Pick a Player                    │
├─────────────────┬──────────────┬──────────────────────┤
│  👥 Players     │  🎡 Spinner  │  🎉 Selected Player  │
├─────────────────┼──────────────┼──────────────────────┤
│ P01 Alice       │    ↻ ↻ ↻      │  Selected Player     │
│ P02 Bob         │    ↻ ↻ ↻      │  ID: P03            │
│ P03 Charlie ✓   │    ↻ ↻ ↻      │  Name: Charlie      │
│ (Already Won)   │              │  Points: 20         │
│                 │  🎡 SPIN     │                      │
│                 │  Button      │                      │
└─────────────────┴──────────────┴──────────────────────┘
```

#### Actions Panel (Step 3)
```
┌────────────────────────────────────────────┐
│    Step 3: Admin Decision                  │
├────────────────────────────────────────────┤
│  Selected: P03 - Charlie                   │
│  Current Points: 20                        │
├────────────────────────────────────────────┤
│ [🏆 REWARD +10] [🚫 DO NOTHING 0]         │
│ [⚠️ PUNISH -10]                            │
└────────────────────────────────────────────┘
```

### Real-Time Features

- **Player Display**: Shows all players with their sequential IDs (P01, P02, P03...)
- **Winner Status**: Already-selected players shown with strikethrough/blur when IsRepeat=false
- **Real-Time Updates**: Players list refreshes every 2 seconds during spinning phase
- **Score Updates**: Selected player's score updates immediately after admin action
- **Animated Spinner**: 2-second rotation animation with random degree calculation

### Data Persistence

All game data is saved to the database:
- Game settings (pointAward, isRepeat) → stored in game.config
- Winner selections → random_winners table
- Player scores → players table
- Game status transitions → games table

## API Endpoints Used

### Fetch Game Settings
```
GET /api/rooms/:roomId/games/:gameId
Response: { config: { pointAward, isRepeat }, status, ... }
```

### Save Game Settings
```
PATCH /api/rooms/:roomId/games/:gameId
Body: { config: { pointAward, isRepeat }, status: 'active' }
```

### Get Players
```
GET /api/rooms/:roomId/players
Response: Array of players with sequenceNumber, score, rank, name...
```

### Update Player Score
```
PATCH /api/rooms/:roomId/players/:playerId
Body: { score: newScore }
```

### Get Previous Winners
```
GET /api/rooms/:roomId/games/:gameId/random/winners
Response: Array of { playerId, adminAction, pointsAwarded }
```

### Record Admin Action
```
POST /api/rooms/:roomId/games/:gameId/random/winners
Body: { playerId, adminAction, pointsAwarded }
```

### End Game & Calculate Rankings
```
PUT /api/rooms/:roomId/games/:gameId/results
Body: { results: [{ playerId, pointsEarned }] }
```

## State Management

### Component State
```typescript
// Game settings
gameSettings: { pointAward: 10, isRepeat: false }
settingsLoaded: boolean

// Game flow
players: Player[]
selectedPlayer: Player | null
previousWinners: Set<string> // IDs of already-selected players
gameStep: 'settings' | 'spinning' | 'actions' | 'ended'

// UI state
spinning: boolean // Spinner animation running
loading: boolean // API call in progress
error: string // Error message display
message: string // Success message display
spinnerRotation: number // Degree of rotation
```

### localStorage Integration
- All player and game data synced via zustand store
- Real-time updates every 2 seconds during spinning
- 500ms debounce prevents excessive API calls

## Key Functions

### loadGameSettings()
- Fetches game settings from API on component mount
- Loads `pointAward` and `isRepeat` from game.config
- Sets settingsLoaded flag to prevent re-loading

### handleStartGame()
- Saves settings to game.config
- Sets game status to 'active'
- Loads players and previous winners
- Transitions to 'spinning' step

### loadPlayers()
- Fetches all players in the room
- Converts snake_case API response to camelCase
- Updates players list for spinner display

### loadPreviousWinners()
- Fetches all winners for current game (if isRepeat=false)
- Builds Set of winner IDs for filtering
- Used to exclude already-selected players

### handleSpin()
- Filters available players (excluding winners if isRepeat=false)
- Randomly selects one player
- Animates spinner for 2 seconds
- Transitions to 'actions' step

### handleAdminAction(action: 'reward' | 'punish' | 'nothing')
- Updates selected player's score (+/- pointAward or no change)
- Records admin action in random_winners table
- Adds player to previousWinners set if isRepeat=false
- Auto-continues to next spin after 1.5 seconds

### handleEndGame()
- Updates game status to 'completed'
- Calculates final rankings based on scores
- Saves game results to database
- Triggers onGameComplete callback

## Integration Points

### Admin Home Page
- Shows active game with RandomGameComponent
- Displays game status in real-time
- Updates player rankings after game ends

### Presenter Display Page
- Shows active game with RandomGameComponent
- All players visible with live score updates
- Displays selected player prominently for audience

### Player Game Page
- Shows active random game during spinning phase
- Players see themselves selected and point changes
- Real-time score and rank updates

## Error Handling

All API calls wrapped in try-catch with user-friendly error messages:
- "Failed to load players"
- "No available players left!" (when isRepeat=false and all selected)
- "Failed to update player score"
- "Failed to save game results"

Errors displayed in red alert box at top of component.

## Success Messaging

After each admin action, success message shows:
- Selected player name
- Action taken (Rewarded/Punished/No change)
- Points awarded/deducted

Example: "Charlie Rewarded! +10 points"

Messages auto-dismiss after 3 seconds.

## Performance Optimizations

1. **Real-Time Updates**: 2000ms polling interval during spinning (vs 3000ms elsewhere)
2. **Debouncing**: 500ms minimum between fetches prevents rapid API calls
3. **Memoized Callbacks**: useCallback prevents unnecessary re-renders
4. **Conditional Fetching**: Only poll when gameStep='spinning'
5. **Optimized Animations**: CSS transform for smooth 2-second spinner rotation

## Design Highlights

1. **Clear Step-by-Step Flow**: 4 distinct visual states guide admin through game
2. **Large, Readable Numbers**: Font sizes scaled for projection/audience view
3. **Color-Coded Actions**: Green (reward), Yellow (nothing), Red (punish)
4. **Visual Feedback**: Messages, animations, button states provide immediate feedback
5. **Mobile-Responsive**: Grid layouts adapt from 1 → 3 columns on desktop
6. **Emoji Icons**: Visual indicators for quick understanding (🎡, 🏆, ⚠️, 🔄)

## Testing Checklist

- [ ] Settings persist when game starts
- [ ] IsRepeat=true allows same player multiple times
- [ ] IsRepeat=false excludes already-selected players
- [ ] Spinner animation runs for 2 seconds
- [ ] Selected player highlighted correctly
- [ ] Admin buttons update player score
- [ ] Previous winners list builds correctly
- [ ] Game ends and calculates rankings
- [ ] Results saved to database
- [ ] Player IDs (P01, P02) display correctly
- [ ] Real-time updates show score changes
- [ ] Error messages display for failed API calls
- [ ] Auto-continues after admin action (1.5s)

## Future Enhancements

1. **5-Second Highlights**: Toast notifications for selected player across all screens
2. **Sound Effects**: Audio feedback for spin, selection, and admin actions
3. **Customization**: Admin can set spin duration, delay between actions
4. **Animations**: Enhanced spinner design with player segments
5. **Statistics**: Track selection frequency, point distribution
6. **Auto-Spin**: Option for automatic spinning at intervals
