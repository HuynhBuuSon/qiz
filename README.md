# Game Web App

A comprehensive, real-time multiplayer gaming platform built with Next.js, PostgreSQL, and WebSocket for live updates.

## Features

- **Admin Panel**: Create and manage games with custom settings
- **Real-time Updates**: WebSocket-based live data synchronization
- **Player Management**: Join games, track scores, and display rankings
- **Presentation Mode**: Dedicated screen for displaying game results
- **Mobile Optimized**: Fully responsive design with Tailwind CSS
- **Color Customization**: Admin can choose theme colors
- **Multiple Game Types**:
  - Weight Game: Calculate weight differences and rank players
  - Random Game: Spinner-based player selection with reward system

## Prerequisites

- Node.js 20.19+ or 22.12+
- PostgreSQL database
- npm or yarn

## Setup

### 1. Database Setup

Ensure PostgreSQL is running with these credentials:
```
Host: localhost
Port: 5432
Database: game
Username: postgres
Password: YourStrongPassword123!
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Update `.env.local` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=YourStrongPassword123!

NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This will automatically create all required tables in your PostgreSQL database.

### 5. Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 6. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── player/            # Player interface
│   ├── presenter/         # Presentation display
│   └── api/               # API routes
├── components/            # React components
├── lib/
│   ├── db/               # Database config & migrations
│   ├── utils/            # Helper functions
│   └── websocket/        # WebSocket client
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

## Architecture

### Frontend
- **Framework**: Next.js 16 with App Router
- **State Management**: Zustand with localStorage persistence
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO client
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with native Node.js pg driver
- **Real-time**: Socket.IO server
- **Types**: TypeScript

### Database Schema

#### game_rooms
Stores game room information with settings

#### players
Player records with scores and rankings

#### games
Game instances with type and status

#### weight_game_data
Specific data for weight-based games

#### random_game_data
Specific data for random selection games

#### game_results
Final results and points earned per player

## User Flows

### Admin Flow
1. Home → Create Game
2. Configure game settings (name, colors, codes, max players, point mode)
3. Admin Home: View players, manage games
4. Games: Start/End games, manage rules
5. Settings: Customize colors and global settings

### Player Flow
1. Home → Join Room
2. Enter player name, room code, join code
3. Player Home: View your rank and points
4. During game: See game status and input (varies by game type)

### Presenter Flow
1. Home → Presentation
2. Enter room code and presentation code
3. Display: Real-time leaderboard with color-coded rankings

## Point Calculation Modes

### Mode 1: Linear (-1 point per rank)
```
Rank 1: 100 points
Rank 2: 99 points
Rank 3: 98 points
...
```

### Mode 2: Proportional
```
Point gap = (pointTo - pointFrom) / totalPlayers
Rank 1: 100 points
Rank 2: 91 points (gap of 9)
Rank 3: 82 points (gap of 9)
...
```

## Game Types

### Weight Game
- Players report start and end weights
- Weight difference is calculated
- Players ranked by difference (most/least)
- Points awarded based on ranking

### Random Game
- Spinner with all players
- Select random player (respects repeat setting)
- Admin can reward/punish or do nothing
- Points updated in real-time

## Local Storage

The app persists these values in browser localStorage:
- User role (admin/player/presenter)
- Room ID
- Player ID
- Admin ID
- Main color
- Color gradient (from/to)

Data is automatically recovered on page refresh.

## WebSocket Events

### Room Events
- `room:update` - Room settings changed
- `room:join` - Player joined
- `room:leave` - Player left

### Game Events
- `game:started` - Game started
- `game:ended` - Game ended
- `game:update` - Game state changed

### Player Events
- `player:joined` - New player joined
- `player:left` - Player left
- `points:updated` - Points/ranking updated

## API Endpoints

### Rooms
- `POST /api/rooms/create` - Create new room
- `GET /api/rooms/:roomId` - Get room details
- `GET /api/rooms/code/:joinCode` - Get room by join code

### Players
- `GET /api/rooms/:roomId/players` - Get all players
- `POST /api/rooms/:roomId/join` - Join room
- `PUT /api/rooms/:roomId/players/:playerId` - Update player
- `DELETE /api/rooms/:roomId/players/:playerId` - Remove player

### Games
- `POST /api/rooms/:roomId/games` - Create game
- `GET /api/rooms/:roomId/games` - Get games
- `POST /api/rooms/:roomId/games/:gameId/start` - Start game
- `POST /api/rooms/:roomId/games/:gameId/end` - End game

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check connection credentials in `.env.local`
- Ensure database `game` exists

### WebSocket Connection Failed
- Check that dev server is running
- Verify `NEXT_PUBLIC_WS_URL` matches your server

### Migrations Failed
- Ensure PostgreSQL has correct permissions
- Check that `game` database exists
- Run migrations again: `npm run migrate`

## Development Tips

1. Use React DevTools browser extension for debugging state
2. Check browser Console for WebSocket connection logs
3. Use PostgreSQL CLI to verify data: `psql -U postgres -d game`
4. Enable verbose logging by setting `LOG_LEVEL=debug`

## License

MIT

## Support

For issues or questions, please check the documentation or create an issue in the repository.
