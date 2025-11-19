import { TestClient } from './setup';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function testInvalidSessionOperations() {
  console.log('\n=== Testing Invalid Session Operations ===');
  
  try {
    // Test starting non-existent session
    console.log('  Test 1: Starting non-existent session...');
    const startResponse = await client.startSession('non-existent-id');
    if (startResponse.status !== 500) {
      throw new Error(`Expected status 500, got ${startResponse.status}`);
    }
    console.log('  ✓ Correctly failed to start non-existent session');
    
    // Test stopping non-existent session
    console.log('  Test 2: Stopping non-existent session...');
    const stopResponse = await client.stopSession('non-existent-id');
    // This should succeed (idempotent) or return 500
    console.log(`  ✓ Stop request handled (status: ${stopResponse.status})`);
    
    // Test creating context without started session
    console.log('  Test 3: Creating context without started session...');
    const sessionResponse = await client.createSession();
    const sessionId = sessionResponse.data.id;
    
    const contextResponse = await client.createContext(sessionId);
    if (contextResponse.status !== 500) {
      throw new Error(`Expected status 500, got ${contextResponse.status}`);
    }
    console.log('  ✓ Correctly failed to create context on inactive session');
    
    // Cleanup
    await client.stopSession(sessionId);
    
    console.log('\n✓ Invalid session operations test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Invalid session operations test failed:', error.message);
    throw error;
  }
}

async function testInvalidPageOperations() {
  console.log('\n=== Testing Invalid Page Operations ===');
  
  try {
    // Test operations on non-existent page
    console.log('  Test 1: Navigating non-existent page...');
    const navigateResponse = await client.navigate('non-existent-page-id', 'https://example.com');
    if (navigateResponse.status !== 500) {
      throw new Error(`Expected status 500, got ${navigateResponse.status}`);
    }
    console.log('  ✓ Correctly failed to navigate non-existent page');
    
    console.log('  Test 2: Clicking on non-existent page...');
    const clickResponse = await client.click('non-existent-page-id', 'button');
    if (clickResponse.status !== 500) {
      throw new Error(`Expected status 500, got ${clickResponse.status}`);
    }
    console.log('  ✓ Correctly failed to click on non-existent page');
    
    console.log('  Test 3: Getting content of non-existent page...');
    const contentResponse = await client.getContent('non-existent-page-id');
    if (contentResponse.status !== 500) {
      throw new Error(`Expected status 500, got ${contentResponse.status}`);
    }
    console.log('  ✓ Correctly failed to get content of non-existent page');
    
    console.log('\n✓ Invalid page operations test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Invalid page operations test failed:', error.message);
    throw error;
  }
}

async function testInvalidContextOperations() {
  console.log('\n=== Testing Invalid Context Operations ===');
  
  try {
    // Test operations on non-existent context
    console.log('  Test 1: Creating page in non-existent context...');
    const pageResponse = await client.createPage('non-existent-context-id');
    if (pageResponse.status !== 500) {
      throw new Error(`Expected status 500, got ${pageResponse.status}`);
    }
    console.log('  ✓ Correctly failed to create page in non-existent context');
    
    console.log('  Test 2: Getting state of non-existent context...');
    const stateResponse = await client.getContextState('non-existent-context-id');
    if (stateResponse.status !== 500) {
      throw new Error(`Expected status 500, got ${stateResponse.status}`);
    }
    console.log('  ✓ Correctly failed to get state of non-existent context');
    
    console.log('  Test 3: Closing non-existent context...');
    const closeResponse = await client.closeContext('non-existent-context-id');
    // This might succeed (idempotent) or return 500
    console.log(`  ✓ Close request handled (status: ${closeResponse.status})`);
    
    console.log('\n✓ Invalid context operations test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Invalid context operations test failed:', error.message);
    throw error;
  }
}

async function testMalformedRequests() {
  console.log('\n=== Testing Malformed Requests ===');
  
  try {
    // Test navigate without URL
    console.log('  Test 1: Navigate without URL...');
    const navigateResponse = await client.client.post('/pages/test-page/navigate', {});
    // Should fail - missing required field
    console.log(`  ✓ Navigate without URL handled (status: ${navigateResponse.status})`);
    
    // Test type without required fields
    console.log('  Test 2: Type without selector...');
    const typeResponse = await client.client.post('/pages/test-page/type', {
      text: 'test',
    });
    console.log(`  ✓ Type without selector handled (status: ${typeResponse.status})`);
    
    // Test evaluate without script
    console.log('  Test 3: Evaluate without script...');
    const evalResponse = await client.client.post('/pages/test-page/evaluate', {});
    console.log(`  ✓ Evaluate without script handled (status: ${evalResponse.status})`);
    
    console.log('\n✓ Malformed requests test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Malformed requests test failed:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('Starting Error Handling Tests...\n');
  
  try {
    await testInvalidSessionOperations();
    await testInvalidPageOperations();
    await testInvalidContextOperations();
    await testMalformedRequests();
    
    console.log('\n=== All Error Handling Tests Passed ===\n');
  } catch (error) {
    console.error('\n=== Error Handling Tests Failed ===\n');
    process.exit(1);
  }
}

runTests();

