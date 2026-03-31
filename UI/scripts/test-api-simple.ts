import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API connectivity...\n');

    // Test 1: Create a room
    console.log('1️⃣  Creating a test room...');
    const roomRes = await axios.post(`${API_URL}/rooms`, {
      name: 'Test Room',
      mainColor: '#3b82f6',
      colorFrom: '#10b981',
      colorTo: '#1e40af',
      maxPlayers: 10,
      pointMode: 1,
      createdBy: 'admin-test',
    });
    console.log('✅ Room created:', roomRes.data.id);
    console.log('   Join Code:', roomRes.data.join_code);
    console.log('   Presentation Code:', roomRes.data.presentation_code);

    const roomId = roomRes.data.id;

    // Test 2: Get room details
    console.log('\n2️⃣  Getting room details...');
    const getRoomRes = await axios.get(`${API_URL}/rooms/${roomId}`);
    console.log('✅ Room retrieved:', getRoomRes.data.name);

    // Test 3: Add a player
    console.log('\n3️⃣  Adding a player...');
    const playerRes = await axios.post(`${API_URL}/rooms/${roomId}/players`, {
      name: 'Test Player 1',
    });
    console.log('✅ Player added:', playerRes.data.id);
    console.log('   Name:', playerRes.data.name);
    console.log('   Score:', playerRes.data.score);

    const playerId = playerRes.data.id;

    // Test 4: Get all players
    console.log('\n4️⃣  Getting all players...');
    const playersRes = await axios.get(`${API_URL}/rooms/${roomId}/players`);
    console.log('✅ Players retrieved:', playersRes.data.length, 'player(s)');

    // Test 5: Create a game
    console.log('\n5️⃣  Creating a game...');
    const gameRes = await axios.post(`${API_URL}/rooms/${roomId}/games`, {
      type: 'weight',
      config: { testMode: true },
    });
    console.log('✅ Game created:', gameRes.data.id);
    console.log('   Type:', gameRes.data.type);
    console.log('   Status:', gameRes.data.status);

    const gameId = gameRes.data.id;

    // Test 6: Get all games
    console.log('\n6️⃣  Getting all games...');
    const gamesRes = await axios.get(`${API_URL}/rooms/${roomId}/games`);
    console.log('✅ Games retrieved:', gamesRes.data.length, 'game(s)');

    // Test 7: Update player score
    console.log('\n7️⃣  Updating player score...');
    const updatePlayerRes = await axios.patch(
      `${API_URL}/rooms/${roomId}/players/${playerId}`,
      {
        score: 150,
        rank: 1,
      }
    );
    console.log('✅ Player updated:');
    console.log('   Score:', updatePlayerRes.data.score);
    console.log('   Rank:', updatePlayerRes.data.rank);

    // Test 8: Start game
    console.log('\n8️⃣  Starting game...');
    const startGameRes = await axios.patch(
      `${API_URL}/rooms/${roomId}/games/${gameId}`,
      { status: 'active' }
    );
    console.log('✅ Game started:');
    console.log('   Status:', startGameRes.data.status);

    // Test 9: Get single game
    console.log('\n9️⃣  Getting single game...');
    const getGameRes = await axios.get(
      `${API_URL}/rooms/${roomId}/games/${gameId}`
    );
    console.log('✅ Game retrieved:');
    console.log('   Type:', getGameRes.data.type);
    console.log('   Status:', getGameRes.data.status);

    // Test 10: End game
    console.log('\n🔟 Ending game...');
    const endGameRes = await axios.patch(
      `${API_URL}/rooms/${roomId}/games/${gameId}`,
      { status: 'completed' }
    );
    console.log('✅ Game ended:');
    console.log('   Status:', endGameRes.data.status);

    // Test 11: Delete game
    console.log('\n1️⃣1️⃣  Deleting game...');
    const deleteGameRes = await axios.delete(
      `${API_URL}/rooms/${roomId}/games/${gameId}`
    );
    console.log('✅ Game deleted');

    // Test 12: Delete player
    console.log('\n1️⃣2️⃣  Deleting player...');
    const deletePlayerRes = await axios.delete(
      `${API_URL}/rooms/${roomId}/players/${playerId}`
    );
    console.log('✅ Player deleted');

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('📊 API is working correctly');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testAPI();
