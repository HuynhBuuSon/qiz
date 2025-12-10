# Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites Check
✅ PostgreSQL installed and running
✅ Node.js 20.19+ installed
✅ npm installed

### Step 1: Database Preparation (2 min)

Open PostgreSQL terminal and run:
```bash
psql -U postgres
CREATE DATABASE game;
\q
```

### Step 2: Run Migrations (1 min)

From project directory:
```bash
npm run migrate
```

### Step 3: Start Server (1 min)

```bash
npm run dev
```

### Step 4: Open Browser (1 min)

Visit: **http://localhost:3000**

## 🎮 Try It Out

### Test Admin Flow
1. Click **"Create Game"** on home page
2. Fill in:
   - Game Name: "Test Game"
   - Choose max players
   - Select point mode
3. Click **Create Game**
4. You'll see **Admin Home** with player grid (empty for now)

### Test Player Flow
1. In new browser tab/window: **http://localhost:3000**
2. Click **"Join Room"**
3. Enter:
   - Player Name: "Test Player"
   - Room Number: (admin should provide)
   - Join Code: (admin should provide)
4. Click **Join Room**
5. See player appears in admin's player grid

### Test Presentation Flow
1. In another tab: **http://localhost:3000**
2. Click **"Presentation"**
3. Enter room code and presentation code
4. See real-time player rankings displayed

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `.env.local` | Database credentials |
| `src/app/page.tsx` | Main home page |
| `src/store/gameStore.ts` | State management |
| `src/types/index.ts` | Type definitions |
| `src/lib/db/migrations.ts` | Database schema |

## 🔧 Useful Commands

```bash
# Development
npm run dev          # Start dev server

# Database
npm run migrate      # Run migrations

# Build
npm run build        # Production build
npm start            # Run production

# Lint
npm run lint         # Check code quality
```

## 🐛 Common Issues

### "Cannot connect to database"
```bash
# Verify PostgreSQL running
psql -U postgres -d game

# If fails, start PostgreSQL service
# Windows: services.msc → PostgreSQL
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### "Next.js won't start"
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### "Port 3000 already in use"
```bash
# Use different port
PORT=3001 npm run dev
```

## 📋 Next Development Tasks

In priority order:

1. **API Endpoints**
   - [ ] Complete room join/leave
   - [ ] Player CRUD operations
   - [ ] Game management endpoints

2. **WebSocket Integration**
   - [ ] Set up Socket.IO server
   - [ ] Room synchronization
   - [ ] Real-time updates

3. **Game Implementation**
   - [ ] Weight game logic
   - [ ] Random game spinner
   - [ ] Points/ranking calculation

4. **UI Enhancements**
   - [ ] Player edit profile
   - [ ] Game in-progress screens
   - [ ] Error handling
   - [ ] Loading states

## 📚 Documentation

- **Full Setup**: See `SETUP_COMPLETE.md`
- **Database Guide**: See `DATABASE_SETUP.md`
- **Developer Docs**: See `README.md`
- **Instructions**: See `.github/copilot-instructions.md`

## 💡 Development Tips

1. **State Debugging**
   - Open browser DevTools Console
   - Check localStorage for app state
   - Use Zustand store directly

2. **Database Testing**
   ```bash
   psql -U postgres -d game
   SELECT * FROM game_rooms;
   SELECT * FROM players;
   ```

3. **API Testing**
   - Use Postman or curl
   - Check `src/lib/utils/api.ts` for endpoints
   - Monitor server logs in terminal

4. **Hot Reload**
   - Save files to auto-refresh
   - Check browser console for errors
   - Server logs show compilation status

## 🎯 Project Goals

- ✅ Setup Next.js + PostgreSQL
- ✅ Create responsive UI
- ✅ Implement state management
- ✅ Set up database schema
- ⏳ Build game features
- ⏳ Add real-time sync
- ⏳ Deploy to production

## 📞 Getting Help

1. Check error messages in browser console
2. Check server logs in terminal
3. Review relevant documentation files
4. Check `.github/copilot-instructions.md`

## 🎉 You're Ready!

Your game app is set up and running. Start developing by:
1. Opening `src/app/` folder
2. Editing components
3. Testing in browser (auto-reloads)
4. Building amazing features!

**Happy coding!** 🚀
