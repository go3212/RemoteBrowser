import { TestClient, sleep } from './setup';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function testCreateSession() {
  console.log('\n=== Testing Session Creation ===');
  
  try {
    const response = await client.createSession();
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const session = response.data;
    
    if (!session.id) {
      throw new Error('Missing session ID in response');
    }
    
    if (session.status !== 'idle') {
      throw new Error(`Expected status 'idle', got '${session.status}'`);
    }
    
    console.log('✓ Session created successfully');
    console.log(`  Session ID: ${session.id}`);
    console.log(`  Status: ${session.status}`);
    
    return session.id;
  } catch (error: any) {
    console.error('✗ Session creation failed:', error.message);
    throw error;
  }
}

async function testGetSession(sessionId: string) {
  console.log('\n=== Testing Get Session ===');
  
  try {
    const response = await client.getSession(sessionId);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const session = response.data;
    
    if (session.id !== sessionId) {
      throw new Error(`Session ID mismatch: expected ${sessionId}, got ${session.id}`);
    }
    
    console.log('✓ Session retrieved successfully');
    console.log(`  Session ID: ${session.id}`);
    console.log(`  Status: ${session.status}`);
    
    return true;
  } catch (error: any) {
    console.error('✗ Get session failed:', error.message);
    throw error;
  }
}

async function testGetNonExistentSession() {
  console.log('\n=== Testing Get Non-Existent Session ===');
  
  try {
    const response = await client.getSession('non-existent-id');
    
    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }
    
    console.log('✓ Correctly returned 404 for non-existent session');
    
    return true;
  } catch (error: any) {
    console.error('✗ Non-existent session test failed:', error.message);
    throw error;
  }
}

async function testStartSession(sessionId: string) {
  console.log('\n=== Testing Start Session ===');
  console.log('  (This may take 10-30 seconds to start Docker container)');
  
  try {
    const response = await client.startSession(sessionId);
    
    if (response.status !== 200) {
      console.error(`Response: ${JSON.stringify(response.data)}`);
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const session = response.data;
    
    if (session.status !== 'active') {
      throw new Error(`Expected status 'active', got '${session.status}'`);
    }
    
    if (!session.wsEndpoint) {
      throw new Error('Missing wsEndpoint in started session');
    }
    
    if (!session.workerContainerName) {
      throw new Error('Missing workerContainerName in started session');
    }
    
    console.log('✓ Session started successfully');
    console.log(`  Status: ${session.status}`);
    console.log(`  WS Endpoint: ${session.wsEndpoint}`);
    console.log(`  Container: ${session.workerContainerName}`);
    
    return true;
  } catch (error: any) {
    console.error('✗ Start session failed:', error.message);
    throw error;
  }
}

async function testStopSession(sessionId: string) {
  console.log('\n=== Testing Stop Session ===');
  
  try {
    const response = await client.stopSession(sessionId);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    // Wait a bit for cleanup
    await sleep(2000);
    
    // Verify session still exists but is idle
    const getResponse = await client.getSession(sessionId);
    if (getResponse.status === 200) {
      const session = getResponse.data;
      if (session.status !== 'idle') {
        throw new Error(`Expected status 'idle' after stop, got '${session.status}'`);
      }
    }
    
    console.log('✓ Session stopped successfully');
    
    return true;
  } catch (error: any) {
    console.error('✗ Stop session failed:', error.message);
    throw error;
  }
}

async function testCreateSessionWithOptions() {
  console.log('\n=== Testing Session Creation with Launch Options ===');
  
  try {
    const response = await client.createSession({
      launchOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
      activeTimeout: 600000, // 10 minutes
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const session = response.data;
    
    console.log('✓ Session with options created successfully');
    console.log(`  Session ID: ${session.id}`);
    
    return session.id;
  } catch (error: any) {
    console.error('✗ Session with options creation failed:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('Starting Session Tests...');
  console.log('⚠ Note: These tests require Docker to be running');
  
  let sessionId: string | null = null;
  let sessionWithOptionsId: string | null = null;
  
  try {
    // Test basic session operations
    sessionId = await testCreateSession();
    if (!sessionId) throw new Error('Failed to create session');
    await testGetSession(sessionId);
    await testGetNonExistentSession();
    await testStartSession(sessionId);
    await testStopSession(sessionId);
    
    // Test session with options (don't start to save time)
    sessionWithOptionsId = await testCreateSessionWithOptions();
    if (!sessionWithOptionsId) throw new Error('Failed to create session with options');
    await testGetSession(sessionWithOptionsId);
    
    console.log('\n=== All Session Tests Passed ===\n');
  } catch (error) {
    console.error('\n=== Session Tests Failed ===\n');
    process.exit(1);
  } finally {
    // Cleanup
    if (sessionId !== null) {
      try {
        await client.stopSession(sessionId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (sessionWithOptionsId !== null) {
      try {
        await client.stopSession(sessionWithOptionsId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

runTests();
