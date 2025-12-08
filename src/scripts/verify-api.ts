#!/usr/bin/env node
/**
 * API Verification Script
 * Tests all major API endpoints to ensure they work correctly
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api';
let testsPassed = 0;
let testsFailed = 0;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: string, message: string) {
  console.log(`${colors[color as keyof typeof colors]}${message}${colors.reset}`);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    log('cyan', `\n▶ ${name}`);
    await fn();
    log('green', `✅ PASSED`);
    testsPassed++;
  } catch (error: any) {
    log('red', `❌ FAILED`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    testsFailed++;
  }
}

async function runTests() {
  log('blue', '╔════════════════════════════════════════╗');
  log('blue', '║   🧪 API VERIFICATION TEST SUITE       ║');
  log('blue', '╚════════════════════════════════════════╝\n');

  let roomId = '';
  let playerId = '';
  let gameId = '';
  const adminId = uuidv4();

  // Test 1: Create Room
  await test('1. Create a game room', async () => {
    const res = await axios.post(`${API_URL}/rooms`, {
      name: 'Test Room ' + new Date().getTime(),
      mainColor: '#3b82f6',
      colorFrom: '#10b981',
      colorTo: '#1e40af',
      maxPlayers: 10,
      pointMode: 1,
      pointFrom: 0,
      pointTo: 100,
      createdBy: adminId,
    });
    roomId = res.data.id;
    if (!roomId) throw new Error('No room ID returned');
    log('yellow', `   📍 Room ID: ${roomId}`);
  });

  // Test 2: Get Room Details
  await test('2. Get room details', async () => {
    const res = await axios.get(`${API_URL}/rooms/${roomId}`);
    if (res.data.id !== roomId) throw new Error('Room mismatch');
    log('yellow', `   📍 Room: ${res.data.name}`);
  });

  // Test 3: Add Player
  await test('3. Add a player to room', async () => {
    const res = await axios.post(`${API_URL}/rooms/${roomId}/players`, {
      name: 'Test Player ' + Math.floor(Math.random() * 1000),
    });
    playerId = res.data.id;
    if (!playerId) throw new Error('No player ID returned');
    log('yellow', `   👤 Player ID: ${playerId}`);
  });

  // Test 4: Get All Players
  await test('4. Get all players in room', async () => {
    const res = await axios.get(`${API_URL}/rooms/${roomId}/players`);
    if (!Array.isArray(res.data)) throw new Error('Players should be array');
    log('yellow', `   📊 Players: ${res.data.length}`);
  });

  // Test 5: Get Specific Player
  await test('5. Get specific player details', async () => {
    const res = await axios.get(`${API_URL}/rooms/${roomId}/players/${playerId}`);
    if (res.data.id !== playerId) throw new Error('Player mismatch');
    log('yellow', `   👤 Player: ${res.data.name}`);
  });

  // Test 6: Update Player Score
  await test('6. Update player score', async () => {
    const res = await axios.patch(
      `${API_URL}/rooms/${roomId}/players/${playerId}`,
      {
        score: 100,
        rank: 1,
      }
    );
    if (res.data.score !== 100) throw new Error('Score not updated');
    log('yellow', `   🏆 Score: ${res.data.score}, Rank: ${res.data.rank}`);
  });

  // Test 7: Create Game
  await test('7. Create a game', async () => {
    const res = await axios.post(`${API_URL}/rooms/${roomId}/games`, {
      type: 'weight',
      config: { testMode: true },
    });
    gameId = res.data.id;
    if (!gameId) throw new Error('No game ID returned');
    log('yellow', `   🎮 Game ID: ${gameId}, Type: ${res.data.type}`);
  });

  // Test 8: Get All Games
  await test('8. Get all games in room', async () => {
    const res = await axios.get(`${API_URL}/rooms/${roomId}/games`);
    if (!Array.isArray(res.data)) throw new Error('Games should be array');
    log('yellow', `   🎮 Games: ${res.data.length}`);
  });

  // Test 9: Get Specific Game
  await test('9. Get specific game details', async () => {
    const res = await axios.get(`${API_URL}/rooms/${roomId}/games/${gameId}`);
    if (res.data.id !== gameId) throw new Error('Game mismatch');
    log('yellow', `   🎮 Game Status: ${res.data.status}`);
  });

  // Test 10: Start Game
  await test('10. Start game (change status to active)', async () => {
    const res = await axios.patch(
      `${API_URL}/rooms/${roomId}/games/${gameId}`,
      { status: 'active' }
    );
    if (res.data.status !== 'active') throw new Error('Status not updated');
    log('yellow', `   🎮 Status: ${res.data.status}`);
  });

  // Test 11: End Game
  await test('11. End game (change status to completed)', async () => {
    const res = await axios.patch(
      `${API_URL}/rooms/${roomId}/games/${gameId}`,
      { status: 'completed' }
    );
    if (res.data.status !== 'completed') throw new Error('Status not updated');
    log('yellow', `   🎮 Status: ${res.data.status}`);
  });

  // Test 12: Delete Game
  await test('12. Delete a game', async () => {
    await axios.delete(`${API_URL}/rooms/${roomId}/games/${gameId}`);
  });

  // Test 13: Delete Player
  await test('13. Delete a player', async () => {
    await axios.delete(`${API_URL}/rooms/${roomId}/players/${playerId}`);
  });

  // Test 14: Verify Swagger JSON endpoint
  await test('14. Verify Swagger JSON endpoint', async () => {
    const res = await axios.get(`${API_URL}/swagger.json`);
    if (!res.data.openapi) throw new Error('Invalid Swagger spec');
    if (!res.data.paths) throw new Error('Missing paths in Swagger spec');
    log('yellow', `   📚 Swagger version: ${res.data.openapi}`);
    log('yellow', `   📚 Paths defined: ${Object.keys(res.data.paths).length}`);
  });

  // Final Summary
  log('blue', '\n╔════════════════════════════════════════╗');
  log('blue', '║        📊 TEST RESULTS SUMMARY         ║');
  log('blue', '╚════════════════════════════════════════╝');

  const totalTests = testsPassed + testsFailed;
  const successRate = ((testsPassed / totalTests) * 100).toFixed(1);

  log('green', `\n✅ Passed: ${testsPassed}`);
  log('red', `❌ Failed: ${testsFailed}`);
  log('cyan', `📈 Total: ${totalTests}`);
  log('blue', `🎯 Success Rate: ${successRate}%`);

  if (testsFailed === 0) {
    log('green', '\n🚀 ALL TESTS PASSED! API IS WORKING CORRECTLY!');
    process.exit(0);
  } else {
    log('red', '\n❌ SOME TESTS FAILED. CHECK THE ERRORS ABOVE.');
    process.exit(1);
  }
}

// Give server time to start if needed
setTimeout(runTests, 1500);
