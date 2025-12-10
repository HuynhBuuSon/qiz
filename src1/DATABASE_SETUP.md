# Database Setup Guide

## PostgreSQL Installation & Configuration

### Step 1: Verify PostgreSQL Installation

Check if PostgreSQL is installed and running:

```bash
psql --version
```

### Step 2: Create Database

Connect to PostgreSQL as admin:

```bash
psql -U postgres
```

Create the game database:

```sql
CREATE DATABASE game;
```

Exit psql:

```sql
\q
```

### Step 3: Verify Connection

Test the connection with the configured credentials:

```bash
psql -h localhost -U postgres -d game
```

Enter password: `YourStrongPassword123!`

### Step 4: Run Migrations

From the project directory:

```bash
npm run migrate
```

This will automatically create all required tables:
- game_rooms
- players
- games
- weight_game_data
- random_game_data
- game_results
- weight_entries
- random_winners

### Step 5: Verify Tables

Connect to the database and check tables:

```bash
psql -U postgres -d game
```

List tables:

```sql
\dt
```

You should see all the game tables listed.

## Connection String Reference

The app uses this connection configuration:

```
Host: localhost
Port: 5432
Database: game
User: postgres
Password: YourStrongPassword123!
```

If you change these, update `.env.local`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=YourStrongPassword123!
```

## Troubleshooting

### "Connection refused" Error
- PostgreSQL service is not running
- **Solution**: Start PostgreSQL service
  - Windows: Check Services app or use `pg_ctl start`
  - Mac: `brew services start postgresql`
  - Linux: `sudo systemctl start postgresql`

### "Database does not exist" Error
- Database wasn't created
- **Solution**: Run `CREATE DATABASE game;` in psql

### "Authentication failed" Error
- Wrong password
- **Solution**: Verify password matches `.env.local`

### Migrations Failed
- Permissions issue
- **Solution**: Ensure postgres user has proper permissions
  ```sql
  ALTER DATABASE game OWNER TO postgres;
  ```

## Resetting Database (Optional)

To completely reset the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop the database
DROP DATABASE IF EXISTS game;

# Create new database
CREATE DATABASE game;

# Exit
\q

# Run migrations again
npm run migrate
```

## Backup & Restore

### Backup Database

```bash
pg_dump -U postgres -d game > game_backup.sql
```

### Restore Database

```bash
psql -U postgres -d game < game_backup.sql
```

## Production Considerations

For production deployment:
1. Use a strong password (not the default)
2. Configure PostgreSQL connection pooling
3. Enable SSL for connections
4. Set up regular backups
5. Monitor database performance
6. Use read replicas for high traffic

## Database Diagram

```
game_rooms (parent)
├── players (references game_rooms)
├── games (references game_rooms)
│   ├── weight_game_data
│   ├── weight_entries
│   ├── random_game_data
│   ├── random_winners
│   └── game_results
```

All foreign keys have ON DELETE CASCADE for data integrity.

## Useful PostgreSQL Commands

```sql
-- List all databases
\l

-- Connect to database
\c game

-- List all tables
\dt

-- Show table structure
\d table_name

-- Count records in table
SELECT COUNT(*) FROM table_name;

-- Clear all data (careful!)
DELETE FROM table_name;

-- Drop all tables (careful!)
DROP TABLE IF EXISTS 
  random_winners, 
  weight_entries, 
  game_results, 
  random_game_data, 
  weight_game_data, 
  games, 
  players, 
  game_rooms CASCADE;
```

## Support

For PostgreSQL issues, visit: https://www.postgresql.org/docs/
