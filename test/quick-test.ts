#!/usr/bin/env tsx

/**
 * Quick smoke test to verify the server is running and basic functionality works
 * This is useful for rapid development cycles
 */

import { TestClient, sleep } from './setup';

async function quickTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Remote Browser - Quick Smoke Test               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const client = new TestClient(undefined, process.env.AUTH_PASSWORD);
  
  let sessionId: string | null = null;
  
  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await client.healthCheck();
    if (healthResponse.status !== 200) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    console.log('   ✓ Server is responding');
    
    // Test 2: Create session
    console.log('2. Testing session creation...');
    const sessionResponse = await client.createSession();
    if (sessionResponse.status !== 200) {
      throw new Error(`Session creation failed: ${sessionResponse.status}`);
    }
    sessionId = sessionResponse.data.id;
    console.log(`   ✓ Session created: ${sessionId}`);
    
    // Test 3: Get session
    console.log('3. Testing session retrieval...');
    const getResponse = await client.getSession(sessionId);
    if (getResponse.status !== 200) {
      throw new Error(`Get session failed: ${getResponse.status}`);
    }
    console.log('   ✓ Session retrieved successfully');
    
    // Test 4: Test invalid operations
    console.log('4. Testing error handling...');
    const invalidResponse = await client.getSession('non-existent-id');
    if (invalidResponse.status !== 404) {
      throw new Error(`Expected 404 for invalid session, got ${invalidResponse.status}`);
    }
    console.log('   ✓ Error handling works correctly');
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                   ✓ ALL TESTS PASSED                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('The server is working correctly!');
    console.log('Run `npm test` for comprehensive integration tests.');
    console.log('');
    
  } catch (error: any) {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                   ✗ TEST FAILED                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    console.log('Please ensure:');
    console.log('  - The server is running (npm start)');
    console.log('  - Docker is running');
    console.log('  - The correct port is configured');
    if (process.env.AUTH_PASSWORD) {
      console.log('  - AUTH_PASSWORD is set correctly');
    }
    console.log('');
    process.exit(1);
  } finally {
    // Cleanup
    if (sessionId) {
      try {
        await client.stopSession(sessionId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

quickTest();

