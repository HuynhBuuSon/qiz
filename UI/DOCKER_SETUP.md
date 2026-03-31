# Docker Setup Guide - QIZ Game Application

## Overview

This guide provides complete Docker setup instructions for the QIZ game application, including:
- Multi-stage Docker build for optimized production image
- Docker Compose orchestration with PostgreSQL database
- Automatic database migrations on startup
- Health checks and proper networking

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- 2GB+ available disk space
- Ports 3000 (app) and 5432 (database) available

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# From the project root directory
cd src

# Start all services (app + database)
docker-compose up --build

# The application will be available at http://localhost:3000
# Database will be ready on localhost:5432
```

### 2. Run Database Migrations

Migrations run automatically on startup, but you can also run them manually:

```bash
# Inside the running container
docker-compose exec app npm run migrate

# Or with the app service specifically
docker exec qiz-app npm run migrate
```

### 3. Stop Services

```bash
# Stop all services (preserves data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## File Structure

```
src/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Service orchestration
├── .env.docker            # Docker environment variables
├── .dockerignore           # Build optimization
├── src/
│   └── lib/
│       └── db/
│           └── config.ts   # Updated for Docker compatibility
└── package.json
```

## Configuration

### Environment Variables

The `.env.docker` file contains all Docker-related environment variables:

```env
# Database Configuration
POSTGRES_DB=game
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DB_HOST=postgres          # Must match service name in docker-compose.yml
DB_PORT=5432             # Container port (internal)
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=postgres

# Application Configuration
NODE_ENV=production
APP_PORT=3000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### Customization

To customize the setup, create a `.env.local` file:

```bash
cp .env.docker .env.local
# Edit .env.local with your custom values
docker-compose up --build
```

#### Common Customizations

**Change Database Password:**
```env
POSTGRES_PASSWORD=your-secure-password
DB_PASSWORD=your-secure-password
```

**Change App Port:**
```env
APP_PORT=8080
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Change Database Port (external):**
```env
POSTGRES_PORT=5433
```

**Enable Database Query Logging:**
```env
DEBUG_DB=true
```

## Docker Architecture

### Multi-Stage Build

The Dockerfile uses a 3-stage build process for optimization:

**Stage 1: deps**
- Install production dependencies only
- Smaller intermediate image
- Cached for faster rebuilds

**Stage 2: builder**
- Install all dependencies (including dev)
- Build Next.js application
- Generate optimized .next folder

**Stage 3: runner**
- Copy only necessary artifacts
- Create non-root user for security
- Install production dependencies only
- Add health checks
- Minimal final image size (~400MB)

### Container Network

- **Service Name:** `qiz-network` (bridge network)
- **App Service:** `qiz-app` (port 3000 internal)
- **Database Service:** `qiz-postgres` (port 5432 internal)

Services communicate via service names:
- App connects to database at: `postgres:5432`
- External access: `localhost:3000` and `localhost:5432`

## Database

### PostgreSQL Setup

- **Image:** postgres:16-alpine
- **Container Name:** qiz-postgres
- **Port:** 5432 (default, configurable)
- **Volume:** `postgres_data` (named volume for persistence)
- **Health Check:** Runs every 10 seconds

### Automatic Migrations

The application runs database migrations automatically on startup:

```yaml
command: sh -c "npm run migrate && node server.js"
```

This ensures the database schema is always up-to-date.

### Data Persistence

Database data is stored in a Docker named volume (`postgres_data`):
- **Persists** across container restarts
- **Removed** with `docker-compose down -v`
- **Located** at `/var/lib/postgresql/data` inside container

### Direct Database Access

```bash
# Connect to PostgreSQL from host
psql -h localhost -U postgres -d game

# Or use the Docker container
docker exec -it qiz-postgres psql -U postgres -d game

# With custom password set PGPASSWORD
PGPASSWORD=your-password psql -h localhost -U postgres -d game
```

## Health Checks

### Application Health Check

```yaml
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3
  CMD node -e "require('http').get('http://localhost:3000/', ...)"
```

- **Interval:** Checks every 30 seconds
- **Timeout:** 10 seconds to respond
- **Start Period:** Waits 40 seconds before first check
- **Retries:** Marks unhealthy after 3 failures

### Database Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

- Runs `pg_isready` every 10 seconds
- App only starts after database is healthy

### Check Status

```bash
# View container health status
docker ps

# Output includes "healthy" or "unhealthy" status
CONTAINER ID  ...  STATUS           ...
abc123de5f    ...  Up 5m (healthy)  ...
```

## Common Commands

### Build

```bash
# Build images without starting containers
docker-compose build

# Rebuild without using cached layers
docker-compose build --no-cache

# Build only specific service
docker-compose build app
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres

# Follow logs (tail -f equivalent)
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100
```

### Execute Commands

```bash
# Run npm script
docker-compose exec app npm run build

# Run shell command
docker-compose exec app sh

# Database shell
docker-compose exec postgres psql -U postgres -d game

# List all tables
docker-compose exec postgres psql -U postgres -d game -c "\dt"
```

### Inspect Services

```bash
# View all running services
docker-compose ps

# View detailed service info
docker-compose config

# View network details
docker network inspect qiz_qiz-network

# View volume details
docker volume inspect qiz_postgres_data
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove images
docker-compose down --rmi all

# Remove all unused resources
docker system prune -a

# Remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Troubleshooting

### Issue: "Error: connect ECONNREFUSED localhost:5432"

**Cause:** App trying to connect before database is ready

**Solution:** 
```bash
# Restart services
docker-compose restart

# Or check database health
docker-compose logs postgres
```

### Issue: "ERROR: database "game" does not exist"

**Cause:** Migrations haven't run yet

**Solution:**
```bash
# Run migrations manually
docker-compose exec app npm run migrate

# Or restart to trigger automatic migration
docker-compose restart app
```

### Issue: "Error: listen EADDRINUSE :::3000"

**Cause:** Port 3000 already in use

**Solution:**
```bash
# Kill process using port 3000
# Or change port in .env.local
APP_PORT=8080
NEXT_PUBLIC_API_URL=http://localhost:8080
docker-compose up --build
```

### Issue: "Cannot find module 'next'"

**Cause:** Dependencies not installed

**Solution:**
```bash
# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Enable Debug Logging

```bash
# Add to .env.local
DEBUG_DB=true

# Restart app
docker-compose restart app

# View logs with query details
docker-compose logs -f app
```

### Check Database Connection

```bash
# From host machine
docker-compose exec postgres pg_isready

# Should output: accepting connections

# From app container
docker-compose exec app npm run migrate
```

## Performance Optimization

### Image Size

- **builder stage:** ~500MB (contains build tools)
- **runner stage:** ~400MB (production only)
- **Saved:** ~100MB per image

### Build Time

- **First build:** ~2-3 minutes
- **Subsequent builds:** ~30-60 seconds (cached)
- **Rebuild without cache:** ~2-3 minutes

### Database Performance

- **Connection pooling:** Max 20 connections
- **Idle timeout:** 30 seconds
- **Connection timeout:** 2 seconds

## Security Considerations

### Non-Root User

Application runs as `nextjs` user (UID 1001):
```
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
```

### Environment Variables

- Database password: Loaded from environment (not in image)
- Secrets not committed to repository
- Use `.env.local` for local overrides

### Database Access

- Database only accessible within Docker network
- External port configurable
- Change default credentials in production

### Production Recommendations

```env
# Change these for production
POSTGRES_PASSWORD=very-secure-password
DB_PASSWORD=very-secure-password

# Use environment-specific URLs
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com

# Disable debug logging
DEBUG_DB=false
```

## Deployment

### Docker Hub

```bash
# Tag image
docker tag qiz_app:latest yourusername/qiz-app:latest

# Push to registry
docker push yourusername/qiz-app:latest
```

### Cloud Deployment (AWS ECS, Google Cloud Run, etc.)

Use the `docker-compose.yml` as reference:
1. Create separate services for app and database
2. Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
3. Configure environment variables in cloud console
4. Deploy app container
5. Run migrations via container command

## Next Steps

1. **Start Services:**
   ```bash
   docker-compose up --build
   ```

2. **Access Application:**
   - Open http://localhost:3000

3. **Verify Setup:**
   - Check logs: `docker-compose logs`
   - Test API: `curl http://localhost:3000/api/rooms`

4. **Connect to Database:**
   ```bash
   docker-compose exec postgres psql -U postgres -d game
   ```

5. **Monitor Services:**
   ```bash
   docker-compose ps
   docker-compose stats
   ```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review container logs: `docker-compose logs`
3. Verify environment configuration: `docker-compose config`
4. Check Docker system: `docker system info`
