# Game Web App - Copilot Instructions

## Project Overview

This is a comprehensive Next.js-based game web application with PostgreSQL backend and WebSocket real-time updates. The app supports three user roles: Admin (game creator), Player (participant), and Presenter (display screen).

## Completed Setup

- [x] Project scaffolding with Next.js 16, TypeScript, and Tailwind CSS
- [x] Database configuration with PostgreSQL and pg driver
- [x] Zustand state management with localStorage persistence
- [x] WebSocket client setup with Socket.IO
- [x] Type definitions for all entities
- [x] API route structure
- [x] User interfaces for all three roles
- [x] Database migration scripts
- [x] Full build compilation

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard (create, home, games, settings)
│   ├── player/          # Player interface (join, game screens)
│   ├── presenter/       # Presentation display (join, display)
│   ├── api/             # API routes (rooms, games, players)
│   └── page.tsx         # Main entry point
├── components/
│   ├── admin/           # Admin components
│   ├── player/          # Player components
│   ├── presenter/       # Presenter components
│   └── common/          # Shared components
├── lib/
│   ├── db/              # Database config & migrations
│   ├── utils/           # Helper functions (colors, points, ranking)
│   └── websocket/       # Socket.IO client
├── store/               # Zustand game store
├── types/               # TypeScript interfaces
├── scripts/             # Database migration script
└── migrations/          # SQL migration files
```

## Key Features Implemented

### 1. Admin Panel
- Create games with custom settings
- Color customization (main color + gradient)
- Max player selection
- Point mode configuration (Mode 1: -1 per rank, Mode 2: Proportional)
- Player display grid (responsive columns)
- Games management interface
- Settings for global customization

### 2. Player Interface
- Join room with name, room code, and join code
- Player home screen with rank and points
- Edit profile capability (placeholder)
- Mobile-optimized layout with footer menu

### 3. Presenter Display
- Login with room code and presentation code
- Real-time player ranking display
- Color-coded by rank using gradient from/to colors
- Large, readable layout optimized for projection

### 4. Core Systems
- **State Management**: Zustand with localStorage (survives page refresh)
- **Database**: PostgreSQL with auto-migrations
- **Real-time**: Socket.IO ready for implementation
- **Colors**: Gradient interpolation for rank-based coloring
- **Points**: Two calculation modes fully implemented

## Database Schema

Auto-migrated tables:
- `game_rooms` - Game room configurations
- `players` - Player records with scores/ranks
- `games` - Game instances
- `weight_game_data` - Weight game specific data
- `random_game_data` - Random game specific data
- `game_results` - Final game results
- `weight_entries` - Weight game submissions
- `random_winners` - Random game winner history

## Environment Setup

Required in `.env.local`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=YourStrongPassword123!
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## Next Steps for Development

### 1. Backend API Implementation
- [ ] Complete `/api/rooms/[id]` endpoints for room data
- [ ] Implement `/api/rooms/:roomId/join` for player joining
- [ ] Create `/api/rooms/:roomId/players` endpoints
- [ ] Implement `/api/rooms/:roomId/games` endpoints
- [ ] Add weight game endpoints (`/weight/step1`, `/weight/step2`)
- [ ] Add random game endpoints (`/random/spin`, `/random/result`)

### 2. WebSocket Integration
- [ ] Set up Socket.IO server in Next.js
- [ ] Implement room join/leave events
- [ ] Add player update broadcasts
- [ ] Add game state synchronization
- [ ] Implement score/rank update events

### 3. Game Logic Implementation
- [ ] Weight game: Step 1 & 2 logic
- [ ] Weight ranking and point calculation
- [ ] Random game: Spinner logic
- [ ] Random game: Admin actions (reward/punish/nothing)
- [ ] Game result calculation and broadcast

### 4. UI Completeness
- [ ] Player edit profile form
- [ ] Game selection interface for admin
- [ ] Game control panels for each game type
- [ ] Admin game edit modal
- [ ] Player detail popup on admin screen
- [ ] Loading states and error handling
- [ ] Toast notifications for actions

### 5. Testing & Polish
- [ ] Form validation
- [ ] Error handling on API calls
- [ ] Responsive design testing
- [ ] Dark mode support (optional)
- [ ] Accessibility improvements

## Running the Application

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Development
npm run dev

# Production build
npm run build
npm start
```

## Code Generation Tips

When generating new components:
1. Use TypeScript with proper type annotations
2. Follow the mobile-first design pattern
3. Use Tailwind CSS for styling
4. Implement proper error handling
5. Add loading states for async operations
6. Use Zustand store for state management
7. Keep components modular and reusable

## Important Notes

- All pages are marked with `'use client'` for client-side rendering
- Zustand store includes localStorage persistence
- Database migrations are idempotent (safe to run multiple times)
- Socket.IO integration is prepared but not yet implemented
- All routes follow Next.js 16 App Router conventions
- Database uses UUID for all primary keys
- Responsive grid system uses CSS Grid for dynamic layouts
