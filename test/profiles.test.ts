import { TestClient, sleep } from './setup';
import fs from 'fs';
import path from 'path';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function testUserProfileWorkflow() {
  console.log('\n=== Testing User Profile Import/Export ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  const profileName = `test-profile-${Date.now()}`;
  
  try {
    // Setup: Create session with some data
    console.log('  Step 1: Creating session with cookies...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    
    const pageResponse = await client.createPage(contextId);
    pageId = pageResponse.data.pageId;
    
    // Set some cookies and local storage
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            document.cookie = 'test_cookie=test_value; path=/';
            localStorage.setItem('test_key', 'test_value');
          </script>
          <div>Test page with cookies</div>
        </body>
      </html>
    `;
    
    await client.navigate(pageId, 'data:text/html,' + encodeURIComponent(html));
    await sleep(1000);
    
    // Verify cookie was set
    const cookieValue = await client.evaluate(pageId, 'document.cookie');
    if (!cookieValue.data.result.includes('test_cookie')) {
      throw new Error('Cookie was not set');
    }
    console.log('  ✓ Session created with test data');
    
    // Get storage state
    console.log('  Step 2: Getting storage state...');
    const storageState = await client.getContextState(contextId);
    if (storageState.status !== 200) {
      throw new Error('Failed to get storage state');
    }
    console.log('  ✓ Storage state retrieved');
    
    // Note: Profile import/export requires file upload which is harder to test automatically
    // This would require creating actual zip files
    console.log('  ℹ Profile import/export requires file upload (tested manually)');
    
    console.log('\n✓ User profile workflow test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ User profile workflow test failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    if (pageId) await client.closePage(pageId).catch(() => {});
    if (contextId) await client.closeContext(contextId).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function testStorageStatePersistence() {
  console.log('\n=== Testing Storage State Persistence ===');
  
  let sessionId: string | null = null;
  let contextId1: string | null = null;
  let contextId2: string | null = null;
  let pageId1: string | null = null;
  let pageId2: string | null = null;
  
  try {
    // Create first context with cookies
    console.log('  Step 1: Creating first context with cookies...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse1 = await client.createContext(sessionId);
    contextId1 = contextResponse1.data.contextId;
    
    const pageResponse1 = await client.createPage(contextId1);
    pageId1 = pageResponse1.data.pageId;
    
    // Set cookies
    await client.navigate(pageId1, 'data:text/html,' + encodeURIComponent(`
      <html>
        <body>
          <script>
            document.cookie = 'persistent_cookie=should_persist; path=/';
          </script>
        </body>
      </html>
    `));
    await sleep(1000);
    console.log('  ✓ First context created with cookies');
    
    // Get storage state
    console.log('  Step 2: Getting storage state from first context...');
    const storageStateResponse = await client.getContextState(contextId1);
    const storageState = storageStateResponse.data;
    console.log('  ✓ Storage state retrieved');
    
    // Create second context with the same storage state
    console.log('  Step 3: Creating second context with saved storage state...');
    const contextResponse2 = await client.createContext(sessionId, storageState);
    contextId2 = contextResponse2.data.contextId;
    
    const pageResponse2 = await client.createPage(contextId2);
    pageId2 = pageResponse2.data.pageId;
    
    await client.navigate(pageId2, 'data:text/html,' + encodeURIComponent(`
      <html><body><div id="content">Check cookies</div></body></html>
    `));
    await sleep(1000);
    
    // Verify cookies persisted
    const cookieInNewContext = await client.evaluate(pageId2, 'document.cookie');
    if (!cookieInNewContext.data.result.includes('persistent_cookie')) {
      throw new Error('Storage state was not properly restored');
    }
    console.log('  ✓ Cookies persisted to new context');
    
    console.log('\n✓ Storage state persistence test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Storage state persistence test failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    if (pageId1) await client.closePage(pageId1).catch(() => {});
    if (pageId2) await client.closePage(pageId2).catch(() => {});
    if (contextId1) await client.closeContext(contextId1).catch(() => {});
    if (contextId2) await client.closeContext(contextId2).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function testContextIsolation() {
  console.log('\n=== Testing Context Isolation ===');
  
  let sessionId: string | null = null;
  let contextId1: string | null = null;
  let contextId2: string | null = null;
  let pageId1: string | null = null;
  let pageId2: string | null = null;
  
  try {
    console.log('  Setting up session with two contexts...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    // Create two contexts
    const contextResponse1 = await client.createContext(sessionId);
    contextId1 = contextResponse1.data.contextId;
    
    const contextResponse2 = await client.createContext(sessionId);
    contextId2 = contextResponse2.data.contextId;
    
    // Create pages in each context
    const pageResponse1 = await client.createPage(contextId1);
    pageId1 = pageResponse1.data.pageId;
    
    const pageResponse2 = await client.createPage(contextId2);
    pageId2 = pageResponse2.data.pageId;
    
    // Set different cookies in each context
    console.log('  Step 1: Setting different cookies in each context...');
    await client.navigate(pageId1, 'data:text/html,' + encodeURIComponent(`
      <html>
        <body>
          <script>document.cookie = 'context=one; path=/';</script>
        </body>
      </html>
    `));
    
    await client.navigate(pageId2, 'data:text/html,' + encodeURIComponent(`
      <html>
        <body>
          <script>document.cookie = 'context=two; path=/';</script>
        </body>
      </html>
    `));
    await sleep(1000);
    
    // Verify cookies are isolated
    console.log('  Step 2: Verifying cookie isolation...');
    const cookie1 = await client.evaluate(pageId1, 'document.cookie');
    const cookie2 = await client.evaluate(pageId2, 'document.cookie');
    
    if (!cookie1.data.result.includes('context=one')) {
      throw new Error('Context 1 cookie not set correctly');
    }
    
    if (!cookie2.data.result.includes('context=two')) {
      throw new Error('Context 2 cookie not set correctly');
    }
    
    if (cookie1.data.result.includes('context=two') || cookie2.data.result.includes('context=one')) {
      throw new Error('Contexts are not properly isolated');
    }
    
    console.log('  ✓ Contexts are properly isolated');
    
    console.log('\n✓ Context isolation test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Context isolation test failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    if (pageId1) await client.closePage(pageId1).catch(() => {});
    if (pageId2) await client.closePage(pageId2).catch(() => {});
    if (contextId1) await client.closeContext(contextId1).catch(() => {});
    if (contextId2) await client.closeContext(contextId2).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function runTests() {
  console.log('Starting Profile and Storage Tests...');
  console.log('⚠ Note: These tests require Docker to be running\n');
  
  try {
    await testUserProfileWorkflow();
    await testStorageStatePersistence();
    await testContextIsolation();
    
    console.log('\n=== All Profile and Storage Tests Passed ===\n');
  } catch (error) {
    console.error('\n=== Profile and Storage Tests Failed ===\n');
    process.exit(1);
  }
}

runTests();

