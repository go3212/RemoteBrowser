import { TestClient } from './setup';

async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');
  
  const client = new TestClient();
  
  try {
    const response = await client.healthCheck();
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.orchestratorId) {
      throw new Error('Missing orchestratorId in health check response');
    }
    
    console.log('✓ Health check passed');
    console.log(`  Orchestrator ID: ${response.data.orchestratorId}`);
    return true;
  } catch (error: any) {
    console.error('✗ Health check failed:', error.message);
    return false;
  }
}

async function testHealthCheckWithAuth() {
  console.log('\n=== Testing Health Check with Auth ===');
  
  const authPassword = process.env.AUTH_PASSWORD;
  
  if (!authPassword) {
    console.log('⊘ Skipping auth test (AUTH_PASSWORD not set)');
    return true;
  }
  
  // Test without auth - should fail
  const clientNoAuth = new TestClient();
  try {
    const response = await clientNoAuth.healthCheck();
    if (response.status !== 401) {
      throw new Error(`Expected status 401 without auth, got ${response.status}`);
    }
    console.log('✓ Correctly rejected request without auth');
  } catch (error: any) {
    console.error('✗ Auth rejection test failed:', error.message);
    return false;
  }
  
  // Test with correct auth - should pass
  const clientWithAuth = new TestClient(undefined, authPassword);
  try {
    const response = await clientWithAuth.healthCheck();
    if (response.status !== 200) {
      throw new Error(`Expected status 200 with auth, got ${response.status}`);
    }
    console.log('✓ Successfully authenticated request');
  } catch (error: any) {
    console.error('✗ Auth test failed:', error.message);
    return false;
  }
  
  // Test with wrong auth - should fail
  const clientWrongAuth = new TestClient(undefined, 'wrong-password');
  try {
    const response = await clientWrongAuth.healthCheck();
    if (response.status !== 401) {
      throw new Error(`Expected status 401 with wrong auth, got ${response.status}`);
    }
    console.log('✓ Correctly rejected request with wrong password');
  } catch (error: any) {
    console.error('✗ Wrong auth test failed:', error.message);
    return false;
  }
  
  return true;
}

async function runTests() {
  console.log('Starting Health Check Tests...');
  
  const results = await Promise.all([
    testHealthCheck(),
    testHealthCheckWithAuth(),
  ]);
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n=== Health Check Tests Complete: ${passed}/${total} passed ===\n`);
  
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();

