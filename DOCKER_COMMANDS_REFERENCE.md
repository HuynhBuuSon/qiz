# Docker Commands Quick Reference

## 🚀 Core Commands

### Start Services
```bash
# Full startup with build
docker-compose up --build

# Start in background
docker-compose up -d --build

# Just start (no rebuild)
docker-compose up
```

### Stop Services
```bash
# Stop (keep data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# Stop specific service
docker-compose stop app
```

### View Status
```bash
# List running services
docker-compose ps

# Show detailed config
docker-compose config

# Get logs
docker-compose logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs --tail=50
```

---

## 🔨 Build & Rebuild

### Build Operations
```bash
# Build images
docker-compose build

# Force rebuild (no cache)
docker-compose build --no-cache

# Build specific service
docker-compose build app

# Build and start
docker-compose up --build

# Build in background
docker-compose build -d
```

---

## 🐚 Execute Commands

### Run Commands in Container
```bash
# Run command
docker-compose exec app npm run migrate

# Run shell
docker-compose exec app sh

# Run database command
docker-compose exec postgres psql -U postgres -d game -c "SELECT 1"

# Run with user
docker-compose exec -u root app npm install
```

### Alternative: docker exec
```bash
# Direct container access (by name)
docker exec -it qiz-app npm run migrate
docker exec -it qiz-postgres psql -U postgres

# Direct container access (by ID)
docker exec -it <container-id> sh
```

---

## 🗄️ Database Commands

### Access Database
```bash
# Via docker-compose
docker-compose exec postgres psql -U postgres -d game

# Via docker
docker exec -it qiz-postgres psql -U postgres -d game

# With password prompt
PGPASSWORD=postgres psql -h localhost -U postgres -d game
```

### Common Database Operations
```bash
# List all tables
docker-compose exec postgres psql -U postgres -d game -c "\dt"

# Show table schema
docker-compose exec postgres psql -U postgres -d game -c "\d players"

# Show table data
docker-compose exec postgres psql -U postgres -d game -c "SELECT * FROM players LIMIT 10"

# Count rows
docker-compose exec postgres psql -U postgres -d game -c "SELECT COUNT(*) FROM players"

# Backup database
docker-compose exec postgres pg_dump -U postgres game > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres game < backup.sql
```

---

## 📊 Monitoring & Debugging

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres

# Follow logs
docker-compose logs -f
docker-compose logs -f app

# Recent logs
docker-compose logs --tail=100

# Timestamps
docker-compose logs -f --timestamps
```

### Inspect Services
```bash
# View service config
docker-compose config

# List images
docker-compose images

# View volumes
docker volume ls
docker volume inspect qiz_postgres_data

# View networks
docker network ls
docker network inspect qiz_qiz-network

# View container details
docker-compose ps
docker ps -a
```

### Performance Monitoring
```bash
# Live stats
docker stats

# Memory usage
docker stats --no-stream

# Container inspect
docker inspect qiz-app
```

---

## 🔧 Configuration

### Environment Variables
```bash
# View current environment
docker-compose exec app env | grep DB_

# Check database connection
docker-compose exec app node -e "console.log(process.env.DB_HOST)"

# Set environment for command
docker-compose exec -e DEBUG_DB=true app npm run migrate
```

### Port Management
```bash
# View port mappings
docker-compose ps

# Find process using port
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -ti:3000

# Kill process on port
# Windows: taskkill /PID <PID> /F
# macOS/Linux: kill -9 <PID>
```

---

## 🧹 Cleanup

### Remove Resources
```bash
# Remove stopped containers
docker-compose rm

# Remove images
docker-compose down --rmi all
docker-compose down --rmi local

# Remove volumes
docker-compose down -v

# Remove all (containers, images, volumes, networks)
docker-compose down -v --remove-orphans

# Prune unused resources
docker system prune -a

# Deep clean
docker system prune -a --volumes
```

### Selective Cleanup
```bash
# Remove specific container
docker-compose rm app

# Remove specific image
docker rmi qiz_app

# Remove specific volume
docker volume rm qiz_postgres_data
```

---

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find and stop service using port
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or change port in .env.local
APP_PORT=8080
docker-compose up --build
```

#### Database Connection Failed
```bash
# Check if database is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready

# Restart database
docker-compose restart postgres
```

#### Migrations Not Running
```bash
# Check app logs
docker-compose logs app

# Run migrations manually
docker-compose exec app npm run migrate

# Verify database exists
docker-compose exec postgres psql -U postgres -d game -c "\dt"
```

#### Container Won't Start
```bash
# View full logs
docker-compose logs -f

# Check resource usage
docker stats

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

#### Permission Denied
```bash
# For Linux users
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo
sudo docker-compose up
```

---

## 🔍 Inspection & Debugging

### View Detailed Information
```bash
# Container info
docker inspect qiz-app
docker inspect qiz-postgres

# Volume info
docker volume inspect qiz_postgres_data

# Network info
docker network inspect qiz_qiz-network

# Image info
docker image inspect qiz_app
```

### Access Container Shell
```bash
# App container
docker-compose exec app sh
docker-compose exec app bash

# Database container
docker-compose exec postgres sh

# As root
docker-compose exec -u root app sh
```

### Check Container State
```bash
# Detailed status
docker-compose ps -a

# Health status
docker ps --format "{{.Names}}\t{{.Status}}"

# Exit code of last run
docker-compose ps
```

---

## 📈 Optimization

### Build Optimization
```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build

# Check build cache
docker builder du

# Prune build cache
docker builder prune
```

### Runtime Optimization
```bash
# Limit container resources
docker run -m 512m --memory-swap 1g ...

# Set CPU limits
docker run --cpus="1.5" ...

# View resource limits
docker stats --no-stream
```

---

## 🚀 Production Tips

### Before Deploying
```bash
# Verify build succeeds
docker-compose build

# Test start
docker-compose up

# Check all services healthy
docker-compose ps

# Verify database migrations
docker-compose exec app npm run migrate

# Test API
curl http://localhost:3000/api/rooms
```

### Image Management
```bash
# Tag image for registry
docker tag qiz_app:latest myregistry/qiz:latest

# Push to registry
docker push myregistry/qiz:latest

# Pull from registry
docker pull myregistry/qiz:latest

# List images
docker image ls
```

### Save/Load Images
```bash
# Save image to tar
docker save qiz_app > qiz_app.tar

# Load image from tar
docker load < qiz_app.tar
```

---

## 📚 Help & Documentation

### Get Help
```bash
# Docker Compose help
docker-compose --help

# Command specific help
docker-compose up --help
docker-compose exec --help

# Docker help
docker --help
docker run --help
```

### Version Info
```bash
# Docker version
docker --version

# Docker Compose version
docker-compose --version

# Full version info
docker version
docker-compose version
```

---

## 🎯 Workflow Example

### Complete Development Workflow
```bash
# 1. Start services
docker-compose up --build

# 2. Check services are running
docker-compose ps

# 3. View app logs
docker-compose logs -f app

# 4. Make code changes...

# 5. Rebuild if needed
docker-compose up --build

# 6. Test database
docker-compose exec postgres psql -U postgres -d game

# 7. Run migrations
docker-compose exec app npm run migrate

# 8. Check logs again
docker-compose logs

# 9. When done, stop
docker-compose down
```

### Database Backup Workflow
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres game > backup_$(date +%Y%m%d).sql

# List backups
ls -la backup*.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres game < backup_20240101.sql
```

---

## 💡 Pro Tips

1. **Always use service names** (postgres, app) instead of IPs
2. **Volume mount source code** for development (modify docker-compose.yml)
3. **Use -d flag** to run services in background
4. **Check logs first** when troubleshooting
5. **Use .env.local** to override defaults
6. **Backup database** before major changes
7. **Monitor with docker stats** for resource issues
8. **Use --no-cache** if build fails mysteriously

---

## Quick Copy-Paste Snippets

```bash
# Status check
docker-compose ps && echo "✅ All services running"

# Database ready check
docker-compose exec postgres pg_isready

# Quick app restart
docker-compose restart app

# View all logs with date
docker-compose logs -f --timestamps

# Count table rows
docker-compose exec postgres psql -U postgres -d game -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"

# Full cleanup
docker-compose down -v --remove-orphans

# Quick start fresh
docker-compose down -v && docker-compose up --build
```

---

For more detailed information, see:
- `DOCKER_SETUP.md` - Comprehensive guide
- `DOCKER_QUICK_START.md` - Quick reference
- Official Docker docs: https://docs.docker.com
