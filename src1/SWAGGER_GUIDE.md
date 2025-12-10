# 🌐 Swagger API Documentation - Quick Start Guide

## 📱 Access the Swagger UI

### 1. Start the Dev Server
```bash
npm run dev
```
Output:
```
✓ Ready in 721ms
- Local:         http://localhost:3000
- Network:       http://192.168.3.13:3000
```

### 2. Open Swagger Documentation

#### Interactive Swagger UI (Recommended)
```
http://localhost:3000/api/docs
```
🔗 **Features:**
- Interactive "Try it out" button on each endpoint
- Real-time request/response visualization
- Parameter documentation
- Example requests and responses
- Error code explanations

#### Raw OpenAPI JSON Specification
```
http://localhost:3000/api/swagger.json
```
📄 **For:**
- API integrations
- Third-party tools
- IDE documentation generators
- API gateways

---

## 🚀 Using the Swagger UI

### Step 1: Open the Interface
Navigate to: **http://localhost:3000/api/docs**

You'll see:
- ✅ API title: "Game Web App API"
- ✅ Version: "1.0.0"
- ✅ Server: "http://localhost:3000/api"
- ✅ Three main sections: Rooms, Players, Games

### Step 2: Explore Endpoints

Click on any endpoint to expand and see:
- **Summary**: What the endpoint does
- **Parameters**: Required and optional fields
- **Request Body**: Example JSON payload
- **Responses**: Example success and error responses
- **Status Codes**: HTTP status code meanings

### Step 3: Test Endpoints

For each endpoint, you can:
1. Click **"Try it out"** button
2. Enter required parameters (roomId, playerId, etc.)
3. Modify the request body if needed
4. Click **"Execute"**
5. View the response in real-time

### Example: Create a Room

```yaml
Endpoint: POST /rooms

Request Body:
{
  "name": "Game Night",
  "mainColor": "#3b82f6",
  "colorFrom": "#10b981",
  "colorTo": "#1e40af",
  "maxPlayers": 10,
  "pointMode": 1,
  "pointFrom": 0,
  "pointTo": 100,
  "createdBy": "550e8400-e29b-41d4-a716-446655440000"
}

Response (200 OK):
{
  "id": "c4e7428c-6fbd-4764-a041-f11243b8135f",
  "name": "Game Night",
  "join_code": "ABC123",
  "presentation_code": "XYZ789",
  "main_color": "#3b82f6",
  "created_at": "2025-12-08T12:30:45.123Z",
  ...
}
```

---

## 📚 API Sections in Swagger

### 1. **Rooms** 🏠
Manage game rooms and their configurations
- `POST /rooms` - Create a new room
- `GET /rooms/{roomId}` - Get room details

### 2. **Players** 👥
Manage players within rooms
- `GET /rooms/{roomId}/players` - List all players
- `POST /rooms/{roomId}/players` - Add a player
- `GET /rooms/{roomId}/players/{playerId}` - Get player details
- `PATCH /rooms/{roomId}/players/{playerId}` - Update player (score, rank, name)
- `DELETE /rooms/{roomId}/players/{playerId}` - Remove a player

### 3. **Games** 🎮
Manage games within rooms
- `GET /rooms/{roomId}/games` - List all games
- `POST /rooms/{roomId}/games` - Create a new game
- `GET /rooms/{roomId}/games/{gameId}` - Get game details
- `PATCH /rooms/{roomId}/games/{gameId}` - Update game status
- `DELETE /rooms/{roomId}/games/{gameId}` - Delete a game

---

## 🔍 Understanding the Swagger Display

### Request Body Schema

Shows the data structure you need to send:
```json
{
  "name": {
    "type": "string",
    "example": "Quiz Night #1",
    "description": "Room display name"
  },
  "mainColor": {
    "type": "string",
    "example": "#3b82f6",
    "description": "Primary color for the room"
  }
}
```

### Response Schema

Shows what data you'll receive back:
```json
{
  "id": {
    "type": "string",
    "format": "uuid",
    "description": "Unique room identifier"
  },
  "join_code": {
    "type": "string",
    "description": "Code for players to join"
  }
}
```

### Status Codes

```
200 OK          - Successful retrieval/update
201 Created     - Resource successfully created
400 Bad Request - Invalid request parameters
404 Not Found   - Resource doesn't exist
500 Server Error- Database or server error
```

---

## 💡 Testing Workflow

### Test 1: Create a Room
```
1. POST /rooms
2. Provide all required fields
3. Note the returned roomId
4. Copy join_code for later use
```

### Test 2: Add Players to Room
```
1. GET /rooms/{roomId} (verify room exists)
2. POST /rooms/{roomId}/players (add 3-5 players)
3. Note the playerIds
```

### Test 3: Create Games
```
1. POST /rooms/{roomId}/games (create weight game)
2. POST /rooms/{roomId}/games (create random game)
3. Note the gameIds
```

### Test 4: Play Games
```
1. PATCH /rooms/{roomId}/games/{gameId} (set status to "active")
2. PATCH /rooms/{roomId}/players/{playerId} (update scores)
3. PATCH /rooms/{roomId}/games/{gameId} (set status to "completed")
```

### Test 5: Cleanup
```
1. DELETE /rooms/{roomId}/games/{gameId} (remove games)
2. DELETE /rooms/{roomId}/players/{playerId} (remove players)
```

---

## 🛠️ Running the API Tests

### Run All Verification Tests
```bash
npm run verify:api
```

Output shows:
```
🧪 API VERIFICATION TEST SUITE

✅ PASSED: Create a game room
✅ PASSED: Get room details
✅ PASSED: Add a player to room
...
📈 Success Rate: 100.0%
🚀 ALL TESTS PASSED!
```

---

## 📋 API Contract Summary

### Required Headers
```http
Content-Type: application/json
```

### Response Format
All responses are JSON:
```json
{
  "id": "uuid",
  "name": "string",
  "createdAt": "ISO8601 timestamp",
  ...
}
```

Error responses:
```json
{
  "error": "Descriptive error message"
}
```

---

## 🔗 Common Use Cases

### Create and Play a Game
```bash
# 1. Create room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Game","mainColor":"#3b82f6",...}'

# 2. Add player
curl -X POST http://localhost:3000/api/rooms/{roomId}/players \
  -H "Content-Type: application/json" \
  -d '{"name":"Player1"}'

# 3. Create game
curl -X POST http://localhost:3000/api/rooms/{roomId}/games \
  -H "Content-Type: application/json" \
  -d '{"type":"weight","name":"Game1"}'

# 4. Start game
curl -X PATCH http://localhost:3000/api/rooms/{roomId}/games/{gameId} \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'

# 5. Update score
curl -X PATCH http://localhost:3000/api/rooms/{roomId}/players/{playerId} \
  -H "Content-Type: application/json" \
  -d '{"score":100,"rank":1}'

# 6. End game
curl -X PATCH http://localhost:3000/api/rooms/{roomId}/games/{gameId} \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

---

## 🎓 Swagger Features

✅ **Interactive Testing**
- Try requests directly in the browser
- See real responses from your API
- Test error scenarios

✅ **Auto-Generated Documentation**
- Stays in sync with API code
- Examples for every endpoint
- Parameter requirements clearly marked

✅ **Developer-Friendly**
- Searchable endpoints
- Copy/paste request examples
- Clear error documentation

---

## ✅ Verification Checklist

- ✅ Dev server is running (`npm run dev`)
- ✅ Can access Swagger UI at `http://localhost:3000/api/docs`
- ✅ Can see all 13 endpoints in Swagger
- ✅ "Try it out" button works on endpoints
- ✅ Can view OpenAPI spec at `http://localhost:3000/api/swagger.json`
- ✅ All tests pass with `npm run verify:api`
- ✅ Database is connected and migrations completed

---

## 🚀 Next Steps

1. **Integrate with Frontend**
   - Use the endpoint URLs in your React components
   - Update Zustand store from API responses

2. **Test in Production**
   - Build: `npm run build`
   - Start: `npm start`
   - Access: `http://localhost:3000`

3. **Add WebSockets**
   - Real-time player updates
   - Live game status
   - Broadcast score changes

---

**Status: ✅ Swagger API Documentation is Live and Ready to Use!**

Access the interactive Swagger UI now: **http://localhost:3000/api/docs**
