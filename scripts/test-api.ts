#!/usr/bin/env node

import axios, { AxiosError } from 'axios';

interface TestCase {
  name: string;
  method: string;
  path: string;
  body?: any;
  expectedStatus?: number;
}

const API_URL = 'http://localhost:3000/api';
const client = axios.create({
  baseURL: API_URL,
  validateStatus: () => true, // Don't throw on any status code
});

async function makeRequest(
  method: string,
  path: string,
  body?: any
): Promise<{ status: number; data: any }> {
  try {
    const response = await client({
      method,
      url: path,
      data: body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Running API Tests...\n');

  let testsPassed = 0;
  let testsFailed = 0;
  let roomId: string = '';
  let playerId: string = '';
  let gameId: string = '';

  // Test 1: Create a room
  try {
    console.log('1️⃣  Testing: Create Game Room');
    const createRoomRes = await makeRequest('POST', '/rooms', {
      name: `Test Room ${Date.now()}`,
      mainColor: '#3b82f6',
      colorFrom: '#10b981',
      colorTo: '#1e40af',
      maxPlayers: 10,
      pointMode: 1,
      pointFrom: 0,
      pointTo: 100,
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
    });

    if (createRoomRes.status === 200 || createRoomRes.status === 201) {
      roomId = createRoomRes.data.id;
      console.log('   ✅ PASSED - Room created:', roomId);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', createRoomRes.status);
      console.log('   Response:', typeof createRoomRes.data === 'string' ? createRoomRes.data.substring(0, 200) : createRoomRes.data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 2: Get room details
  try {
    console.log('\n2️⃣  Testing: Get Room Details');
    const getRoomRes = await makeRequest('GET', `/rooms/${roomId}`);

    if (getRoomRes.status === 200 && getRoomRes.data.id === roomId) {
      console.log('   ✅ PASSED - Room retrieved:', getRoomRes.data.name);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', getRoomRes.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 3: Add a player
  try {
    console.log('\n3️⃣  Testing: Add Player to Room');
    const addPlayerRes = await makeRequest(
      'POST',
      `/rooms/${roomId}/players`,
      {
        name: 'Test Player 1',
      }
    );

    if (addPlayerRes.status === 201) {
      playerId = addPlayerRes.data.id;
      console.log('   ✅ PASSED - Player added:', playerId);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', addPlayerRes.status);
      console.log('   Response:', addPlayerRes.data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 4: Get players in room
  try {
    console.log('\n4️⃣  Testing: Get All Players in Room');
    const getPlayersRes = await makeRequest('GET', `/rooms/${roomId}/players`);

    if (getPlayersRes.status === 200 && Array.isArray(getPlayersRes.data)) {
      console.log(`   ✅ PASSED - Found ${getPlayersRes.data.length} player(s)`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', getPlayersRes.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 5: Create a game
  try {
    console.log('\n5️⃣  Testing: Create Game');
    const createGameRes = await makeRequest(
      'POST',
      `/rooms/${roomId}/games`,
      {
        type: 'weight',
        config: { testMode: true },
      }
    );

    if (createGameRes.status === 201) {
      gameId = createGameRes.data.id;
      console.log('   ✅ PASSED - Game created:', gameId);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', createGameRes.status);
      console.log('   Response:', createGameRes.data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 6: Get games in room
  try {
    console.log('\n6️⃣  Testing: Get All Games in Room');
    const getGamesRes = await makeRequest('GET', `/rooms/${roomId}/games`);

    if (getGamesRes.status === 200 && Array.isArray(getGamesRes.data)) {
      console.log(`   ✅ PASSED - Found ${getGamesRes.data.length} game(s)`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', getGamesRes.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 7: Update player score
  try {
    console.log('\n7️⃣  Testing: Update Player Score');
    const updatePlayerRes = await makeRequest(
      'PATCH',
      `/rooms/${roomId}/players/${playerId}`,
      {
        score: 100,
        rank: 1,
      }
    );

    if (updatePlayerRes.status === 200 && updatePlayerRes.data.score === 100) {
      console.log('   ✅ PASSED - Player score updated to 100');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', updatePlayerRes.status);
      console.log('   Response:', updatePlayerRes.data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 8: Start a game (update status)
  try {
    console.log('\n8️⃣  Testing: Start Game');
    const startGameRes = await makeRequest(
      'PATCH',
      `/rooms/${roomId}/games/${gameId}`,
      {
        status: 'active',
      }
    );

    if (
      startGameRes.status === 200 &&
      startGameRes.data.status === 'active'
    ) {
      console.log('   ✅ PASSED - Game status changed to active');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', startGameRes.status);
      console.log('   Response:', startGameRes.data);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 9: End a game (update status)
  try {
    console.log('\n9️⃣  Testing: End Game');
    const endGameRes = await makeRequest(
      'PATCH',
      `/rooms/${roomId}/games/${gameId}`,
      {
        status: 'completed',
      }
    );

    if (
      endGameRes.status === 200 &&
      endGameRes.data.status === 'completed'
    ) {
      console.log('   ✅ PASSED - Game status changed to completed');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', endGameRes.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 10: Get single game
  try {
    console.log('\n🔟 Testing: Get Single Game Details');
    const getGameRes = await makeRequest(
      'GET',
      `/rooms/${roomId}/games/${gameId}`
    );

    if (getGameRes.status === 200 && getGameRes.data.id === gameId) {
      console.log('   ✅ PASSED - Game details retrieved');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', getGameRes.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 11: Delete player
  try {
    console.log('\n1️⃣1️⃣  Testing: Delete Player');
    const deletePlayerRes = await makeRequest(
      'DELETE',
      `/rooms/${roomId}/players/${playerId}`
    );

    if (deletePlayerRes.status === 200) {
      console.log('   ✅ PASSED - Player deleted');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', deletePlayerRes.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Test 12: Delete game
  try {
    console.log('\n1️⃣2️⃣  Testing: Delete Game');
    const deleteGameRes = await makeRequest(
      'DELETE',
      `/rooms/${roomId}/games/${gameId}`
    );

    if (deleteGameRes.status === 200) {
      console.log('   ✅ PASSED - Game deleted');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', deleteGameRes.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED - Error:', error);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(
    `📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`
  );
  console.log('='.repeat(50));

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Give the server time to start
setTimeout(runTests, 2000);
