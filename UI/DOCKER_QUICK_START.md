# Docker Quick Start Guide

## 🚀 Start Application in 30 Seconds

### On Windows
```bash
docker-start.bat
```

### On macOS/Linux
```bash
bash docker-start.sh
```

### Manual Start (All Platforms)
```bash
docker-compose up --build
```

**That's it!** The application will be available at **http://localhost:3000**

---

## ✨ What Just Happened?

The Docker setup automatically:

1. ✅ Created a PostgreSQL database
2. ✅ Built the Next.js application
3. ✅ Ran database migrations
4. ✅ Started both services
5. ✅ Configured networking between services

**No manual database setup needed!**

---

## 📋 Common Tasks

### View Running Services
```bash
docker-compose ps
```

### View Application Logs
```bash
docker-compose logs -f app
```

### View Database Logs
```bash
docker-compose logs -f postgres
```

### Connect to Database
```bash
# Using psql (if installed)
psql -h localhost -U postgres -d game

# Using Docker container
docker-compose exec postgres psql -U postgres -d game
```

### Stop Services
```bash
# Keep data
docker-compose down

# Delete all data
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose up --build
```

### Run Migrations Manually
```bash
docker-compose exec app npm run migrate
```

---

## 🔧 Configuration

### Change Database Password
Edit `.env.local`:
```env
POSTGRES_PASSWORD=your-secure-password
DB_PASSWORD=your-secure-password
```

### Change App Port
Edit `.env.local`:
```env
APP_PORT=8080
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Change Database Port
Edit `.env.local`:
```env
POSTGRES_PORT=5433
```

Then restart:
```bash
docker-compose down
docker-compose up --build
```

---

## 🐛 Troubleshooting

### "Error: connect ECONNREFUSED"
Database not ready yet. Wait a moment and refresh the page.

### "Port 3000 already in use"
```bash
# Change port in .env.local
APP_PORT=8080

# Or kill the process
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -ti:3000 | xargs kill -9
```

### "database 'game' does not exist"
Run migrations manually:
```bash
docker-compose exec app npm run migrate
```

### See Full Logs
```bash
docker-compose logs --tail=50 -f
```

---

## 📁 Docker Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for production image |
| `docker-compose.yml` | Service orchestration (app + database) |
| `.env.docker` | Default environment variables |
| `.dockerignore` | Build optimization |
| `docker-start.sh` | Quick start script (macOS/Linux) |
| `docker-start.bat` | Quick start script (Windows) |
| `DOCKER_SETUP.md` | Comprehensive Docker guide |

---

## 🏗️ Architecture

```
┌─────────────────────────┐
│   Your Computer         │
│  ┌───────────────────┐  │
│  │  docker-compose   │  │
│  │   (orchestrates)  │  │
│  └────────┬──────────┘  │
│           │             │
│  ┌────────┴──────────┐  │
│  │   Docker Network  │  │
│  │  (qiz-network)    │  │
│  └────────┬──────────┘  │
│           │             │
│    ┌──────┴──────┐      │
│    │             │      │
│  ┌─┴──┐      ┌──┴─┐    │
│  │App │      │ DB │    │
│  │:80 │      │:54 │    │
│  │    │─────→│    │    │
│  │    │      │    │    │
│  └────┘      └────┘    │
│    ▲                    │
│    │ (localhost:3000)   │
│    └────────┬───────────│─→ Your Browser
│             │           │
└─────────────┴───────────┘
```

---

## 🔐 Security

### Default Credentials (Change in Production!)
```
Username: postgres
Password: postgres
```

### Production Setup
```bash
# Generate secure password
openssl rand -base64 32

# Update .env.local
POSTGRES_PASSWORD=your-generated-password
DB_PASSWORD=your-generated-password

# Rebuild
docker-compose up --build
```

---

## 💾 Data Persistence

- **Database data** persists in Docker volume `postgres_data`
- **Data survives** container restarts
- **Data deleted** with `docker-compose down -v`

---

## 📊 Performance

- **First startup:** 2-3 minutes (image build)
- **Subsequent starts:** 20-30 seconds
- **Database:** PostgreSQL 16 (optimized)
- **Memory:** ~800MB total (database + app)

---

## 🆘 Need Help?

1. **Check logs:** `docker-compose logs`
2. **See full guide:** Open `DOCKER_SETUP.md`
3. **Verify setup:** `docker-compose config`
4. **System info:** `docker system info`

---

## 📚 Next Steps

1. **Access application:**
   - Open http://localhost:3000 in your browser

2. **Verify database:**
   ```bash
   docker-compose exec postgres psql -U postgres -d game -c "\dt"
   ```

3. **Test API:**
   ```bash
   curl http://localhost:3000/api/rooms
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

---

## 🎉 You're Ready!

The application is now running with:
- ✅ Next.js web server
- ✅ PostgreSQL database
- ✅ Automatic migrations
- ✅ Hot reload support (development)
- ✅ Production-ready image

**Happy developing!** 🚀
