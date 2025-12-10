# Random Game - Visual Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RANDOM GAME SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│  │   ADMIN      │      │   PLAYERS        │      │  PRESENTER   │
│  │   (Control)  │◄────►│  (Participate)   │◄────►│ (Display)    │
│  └──────────────┘      └──────────────────┘      └──────────────┘
│        ▲                       ▲                        ▲
│        │                       │                        │
│        └───────────────────────┼────────────────────────┘
│                                │
│                    ┌───────────▼──────────┐
│                    │ REAL-TIME UPDATES    │
│                    │ (2000ms Polling)     │
│                    └───────────┬──────────┘
│                                │
│                    ┌───────────▼──────────┐
│                    │   API ENDPOINTS      │
│                    │ (7 endpoints)        │
│                    └───────────┬──────────┘
│                                │
│                    ┌───────────▼──────────┐
│                    │   DATABASE           │
│                    │ (PostgreSQL)         │
│                    └──────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

## Game State Flow

```
┌────────────────────────────────────────────────────┐
│ STATE: 'settings'                                  │
│ Admin configures:                                  │
│ ├─ Point Award: [10]                             │
│ └─ IsRepeat: [✓]                                 │
│                                                    │
│ ACTION: Click [START GAME]                        │
└────────────┬─────────────────────────────────────┘
             │ Settings saved to game.config
             │ Game status → 'active'
             │
             ▼
┌────────────────────────────────────────────────────┐
│ STATE: 'spinning'                                  │
│ ├─ Spinner visible                               │
│ ├─ Players list shown                            │
│ ├─ Previous winners blurred (if IsRepeat=false)  │
│ │                                                  │
│ │ ACTION: Click [SPIN]                           │
│ ├─→ Random player selected                       │
│ ├─→ Spinner animates (2s)                        │
│ └─→ Selected player highlighted                  │
│                                                    │
│ ACTION: Admin picks action button                │
└────────────┬─────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────┐
│ STATE: 'actions'                                   │
│ ├─ Selected player displayed                      │
│ ├─ Current score shown                            │
│ │                                                  │
│ │ ACTIONS (choose one):                           │
│ ├─ [🏆 REWARD] → Score +10                       │
│ ├─ [🚫 NOTHING] → Score +0                       │
│ └─ [⚠️ PUNISH] → Score -10                       │
│                                                    │
│ AFTER SELECTION:                                  │
│ ├─→ Score updated in database                    │
│ ├─→ Winner recorded                              │
│ ├─→ Success message shown                        │
│ └─→ Auto-continue to spinning (1.5s)             │
│                                                    │
│ ACTION: Admin clicks [END GAME]                  │
└────────────┬─────────────────────────────────────┘
             │ (Or can keep spinning)
             │
             ▼
┌────────────────────────────────────────────────────┐
│ STATE: 'ended'                                     │
│ ├─ Game status → 'completed'                      │
│ ├─ Rankings calculated                            │
│ ├─ Results saved to database                      │
│ │                                                  │
│ │ ACTION: Click [FINALIZE GAME]                   │
│ ├─→ All changes persisted                        │
│ ├─→ Real-time updates sent                       │
│ └─→ Callback to parent component                 │
│                                                    │
│ RESULT:                                            │
│ ├─ Admin sees new rankings                        │
│ ├─ Presenter display updates                      │
│ └─ Players see final scores                       │
└────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────┐
│  ADMIN INPUT            │
│ • Point Award: 10       │
│ • IsRepeat: false       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐         ┌──────────────────┐
│  SAVE SETTINGS          │────────►│  game.config     │
│ PATCH /api/rooms/...    │         │  (Database)      │
│ { config, status }      │         └──────────────────┘
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐         ┌──────────────────┐
│  LOAD PLAYERS           │────────►│  players[] array │
│ GET /api/players        │         │  (State)         │
└─────────────────────────┘         └──────────────────┘
         │
         ▼
┌─────────────────────────┐
│  SPIN WHEEL             │
│  Random Algorithm       │
│  ├─ Filter available    │
│  ├─ Pick random index   │
│  └─ Animate (2s)        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐         ┌──────────────────┐
│  SELECT PLAYER          │────────►│  selectedPlayer  │
│ { id, name, score }     │         │  (State)         │
└─────────────────────────┘         └──────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ADMIN ACTION                       │
│  ├─ REWARD: +pointAward            │
│  ├─ NOTHING: +0                    │
│  └─ PUNISH: -pointAward            │
└────────┬────────────────────────────┘
         │
         ├─────────────────────────────────┬──────────────────┐
         │                                 │                  │
         ▼                                 ▼                  ▼
┌──────────────────┐        ┌──────────────────┐   ┌─────────────────┐
│ UPDATE SCORE     │        │ RECORD ACTION    │   │ ADD TO WINNERS  │
│ PATCH /players   │        │ POST /winners    │   │ Set<string>     │
│ { score: new }   │        │ { admin_action } │   └─────────────────┘
└──────────────────┘        └──────────────────┘
         │                           │
         └───────────────┬───────────┘
                         ▼
            ┌──────────────────────────────┐
            │ REAL-TIME SYNC               │
            │ ├─ Update all screens        │
            │ ├─ Player sees score change  │
            │ ├─ Presenter sees update     │
            │ └─ Admin confirms action     │
            └──────────────────────────────┘
```

## Component State Machine

```
                    ┌────────────────────────┐
                    │    COMPONENT MOUNT     │
                    │  loadGameSettings()    │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
        ┌──────────►│   gameStep = settings  │
        │           └────────────────────────┘
        │                       │
        │           ┌───────────▼────────────┐
        │           │   ADMIN CLICKS START   │
        │           │   handleStartGame()    │
        │           └───────────┬────────────┘
        │                       │
        │           ┌───────────▼────────────┐
        │           │  gameStep = spinning   │
        │           │  Load players          │
        │           │  Start polling (2000ms)│
        │           └───────────┬────────────┘
        │                       │
        │ ┌─────────────────────┴────────────┐
        │ │                                  │
        │ │                    ┌─────────────▼──┐
        │ │                    │ ADMIN SPINS    │
        │ │                    │ handleSpin()   │
        │ │                    └─────────┬──────┘
        │ │                              │
        │ │                 ┌────────────▼──────────┐
        │ │                 │ Animate (2s) +        │
        │ │                 │ Select random player  │
        │ │                 └────────────┬──────────┘
        │ │                              │
        │ │                 ┌────────────▼──────────┐
        │ │                 │ gameStep = actions    │
        │ │                 │ Show action buttons   │
        │ │                 └────────────┬──────────┘
        │ │                              │
        │ │                ┌─────────────▼──────────┐
        │ │                │ ADMIN CHOOSES ACTION   │
        │ │                │ handleAdminAction()    │
        │ │                └─────────┬──────────────┘
        │ │                          │
        │ │            ┌─────────────▼────────────┐
        │ │            │ Update score + database  │
        │ │            │ Auto-continue (1.5s)     │
        │ │            └─────────────┬────────────┘
        │ │                          │
        │ └──────────────────────────┤
        │     (Can spin again)       │
        │                            │
        │          ┌─────────────────▼──────────┐
        │          │ ADMIN CLICKS END GAME      │
        │          │ handleEndGame()            │
        │          └─────────────┬──────────────┘
        │                        │
        │          ┌─────────────▼──────────────┐
        │          │ gameStep = ended           │
        │          │ Calculate rankings         │
        │          │ Save results               │
        │          └─────────────┬──────────────┘
        │                        │
        │          ┌─────────────▼──────────────┐
        │          │ FINALIZE GAME              │
        │          │ onGameComplete()           │
        │          └────────────────────────────┘
        │                        │
        └────────────────────────┘
             (New game)
```

## Real-Time Update Flow

```
┌───────────────────────────────────────────────────┐
│ useRealTimeUpdates Hook (Active during spinning) │
└───────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌──────────────┐
    │ Socket │   │ Polling  │   │ Debouncing   │
    │ Events │   │ 2000ms   │   │ 500ms min    │
    └────────┘   └──────────┘   └──────────────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                ┌───────▼────────┐
                │  debouncedFetch│
                │  loadPlayers() │
                └───────┬────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌────────┐   ┌───────────┐   ┌───────────┐
    │ Admin  │   │ Presenter │   │ Players   │
    │ See    │   │ Display   │   │ See       │
    │ Update │   │ Updates   │   │ Updates   │
    └────────┘   └───────────┘   └───────────┘
```

## Player Selection Logic

```
┌────────────────────────────────────────┐
│ All Players in Room                    │
│ ├─ P01: Alice  (score: 10)            │
│ ├─ P02: Bob    (score: 20)            │
│ ├─ P03: Charlie (score: 15)           │
│ ├─ P04: Diana  (score: 5)             │
│ └─ P05: Eve    (score: 25)            │
└────────────────────────────────────────┘
                    │
        ┌───────────▼──────────┐
        │  Check IsRepeat      │
        └───────────┬──────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
        ▼                      ▼
    ┌─────────────┐     ┌─────────────┐
    │ IsRepeat    │     │ IsRepeat    │
    │ = false     │     │ = true      │
    └─────────────┘     └─────────────┘
        │                      │
        ▼                      ▼
    ┌─────────────┐     ┌─────────────┐
    │ Get         │     │ All Players │
    │ Previous    │     │ Available   │
    │ Winners     │     │             │
    │ (blurred)   │     │ ├─ Alice    │
    │             │     │ ├─ Bob      │
    │ ├─ Bob✓     │     │ ├─ Charlie  │
    │ ├─ Diana✓   │     │ ├─ Diana    │
    │ └─ Eve✓     │     │ └─ Eve      │
    └─────────────┘     └─────────────┘
        │                      │
        ▼                      ▼
    ┌─────────────┐     ┌─────────────┐
    │ Available   │     │ Available   │
    │             │     │             │
    │ ├─ Alice    │     │ ├─ Alice    │
    │ ├─ Charlie  │     │ ├─ Bob      │
    │ └─ (only 2) │     │ ├─ Charlie  │
    │             │     │ ├─ Diana    │
    │             │     │ └─ Eve (all)│
    └────┬────────┘     └────┬────────┘
         │                   │
         └─────────┬─────────┘
                   │
        ┌──────────▼──────────┐
        │ Random Selection    │
        │ (equally likely)    │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ Selected Player     │
        │ (highlighted)       │
        └─────────────────────┘
```

## Admin Action Matrix

```
╔══════════════════════════════════════════════════════════════╗
║              ADMIN DECISION MATRIX                           ║
╠═════════════════╦═════════════════╦══════════════════════════╣
║ ACTION          ║ POINT CHANGE    ║ RESULT                   ║
╠═════════════════╬═════════════════╬══════════════════════════╣
║ 🏆 REWARD       ║ +pointAward     ║ Score increases          ║
║                 ║ (e.g. +10)      ║ Rank may improve         ║
║                 ║                 ║ Message: "+10 points"    ║
╠═════════════════╬═════════════════╬══════════════════════════╣
║ 🚫 DO NOTHING   ║ +0              ║ No score change          ║
║                 ║                 ║ Rank unchanged           ║
║                 ║                 ║ Message: "No change"     ║
╠═════════════════╬═════════════════╬══════════════════════════╣
║ ⚠️ PUNISH       ║ -pointAward     ║ Score decreases          ║
║                 ║ (e.g. -10)      ║ Rank may worsen          ║
║                 ║                 ║ Message: "-10 points"    ║
╚═════════════════╩═════════════════╩══════════════════════════╝

Point Award Setting Determines Magnitude:
┌──────────────────────────────────────────┐
│ pointAward = 10                          │
│ ├─ REWARD  → +10                        │
│ ├─ NOTHING → +0                         │
│ └─ PUNISH  → -10                        │
│                                          │
│ pointAward = 50                          │
│ ├─ REWARD  → +50                        │
│ ├─ NOTHING → +0                         │
│ └─ PUNISH  → -50                        │
│                                          │
│ pointAward = 0 (no scoring)              │
│ ├─ REWARD  → +0                         │
│ ├─ NOTHING → +0                         │
│ └─ PUNISH  → -0                         │
└──────────────────────────────────────────┘
```

## Screen Updates Timeline

```
Timeline:
0s     Start Spin
  │
  ├─ Show Spinner (2s animation)
  │
2s     Spinner Stops
  │
  ├─ Show Selected Player
  ├─ Show Action Buttons
  │
  (Admin takes action)
  │
X+0.5s │ ├─ Score Updated in DB
  │ ├─ Message: "Rewarded +10"
  │ ├─ Previous Winners Updated
  │
X+1.5s │ ├─ Auto-Continue
  │ ├─ Clear Selected Player
  │ ├─ Reset Spinner
  │ ├─ Ready for Next Spin
  │
X+2.0s └─ (Can click SPIN again or END GAME)

Real-Time Sync:
  Every 2s during spinning:
  ├─ All Screens Updated
  ├─ Player Scores Synced
  ├─ Rankings Recalculated
  └─ Changes Visible
```

---

This visual architecture demonstrates how all components, data flows, and states interact in the Random Game system.
