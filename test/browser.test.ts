import { TestClient, sleep } from './setup';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function testFullBrowserWorkflow() {
  console.log('\n=== Testing Full Browser Workflow ===');
  console.log('  (This may take 10-30 seconds to start Docker container)');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  
  try {
    // 1. Create session
    console.log('\n  Step 1: Creating session...');
    const sessionResponse = await client.createSession();
    if (sessionResponse.status !== 200) {
      throw new Error(`Failed to create session: ${sessionResponse.status}`);
    }
    sessionId = sessionResponse.data.id;
    console.log(`  ✓ Session created: ${sessionId}`);
    
    // 2. Start session
    console.log('  Step 2: Starting session (this may take a while)...');
    const startResponse = await client.startSession(sessionId);
    if (startResponse.status !== 200) {
      throw new Error(`Failed to start session: ${startResponse.status} - ${JSON.stringify(startResponse.data)}`);
    }
    console.log('  ✓ Session started');
    
    // Wait a bit for browser to be fully ready
    await sleep(3000);
    
    // 3. Create context
    console.log('  Step 3: Creating browser context...');
    const contextResponse = await client.createContext(sessionId);
    if (contextResponse.status !== 200) {
      throw new Error(`Failed to create context: ${contextResponse.status} - ${JSON.stringify(contextResponse.data)}`);
    }
    contextId = contextResponse.data.contextId;
    console.log(`  ✓ Context created: ${contextId}`);
    
    // 4. Get session contexts
    console.log('  Step 4: Getting session contexts...');
    const contextsResponse = await client.getSessionContexts(sessionId);
    if (contextsResponse.status !== 200) {
      throw new Error(`Failed to get contexts: ${contextsResponse.status}`);
    }
    if (!contextsResponse.data.contexts.includes(contextId)) {
      throw new Error('Context not found in session contexts');
    }
    console.log(`  ✓ Found ${contextsResponse.data.contexts.length} context(s)`);
    
    // 5. Create page
    console.log('  Step 5: Creating page...');
    const pageResponse = await client.createPage(contextId);
    if (pageResponse.status !== 200) {
      throw new Error(`Failed to create page: ${pageResponse.status} - ${JSON.stringify(pageResponse.data)}`);
    }
    pageId = pageResponse.data.pageId;
    console.log(`  ✓ Page created: ${pageId}`);
    
    // 6. Navigate to a page
    console.log('  Step 6: Navigating to example.com...');
    const navigateResponse = await client.navigate(pageId, 'https://example.com');
    if (navigateResponse.status !== 200) {
      throw new Error(`Failed to navigate: ${navigateResponse.status} - ${JSON.stringify(navigateResponse.data)}`);
    }
    console.log('  ✓ Navigation successful');
    
    // Wait for page to load
    await sleep(2000);
    
    // 7. Get page content
    console.log('  Step 7: Getting page content...');
    const contentResponse = await client.getContent(pageId);
    if (contentResponse.status !== 200) {
      throw new Error(`Failed to get content: ${contentResponse.status}`);
    }
    const content = contentResponse.data;
    if (!content.includes('Example Domain')) {
      throw new Error('Expected content not found in page');
    }
    console.log('  ✓ Page content retrieved');
    
    // 8. Query selector
    console.log('  Step 8: Testing querySelector...');
    const querySelectorResponse = await client.querySelector(pageId, 'h1');
    if (querySelectorResponse.status !== 200) {
      throw new Error(`Failed to query selector: ${querySelectorResponse.status}`);
    }
    if (!querySelectorResponse.data.result) {
      throw new Error('Expected h1 element not found');
    }
    console.log('  ✓ querySelector successful');
    
    // 9. Query selector all
    console.log('  Step 9: Testing querySelectorAll...');
    const querySelectorAllResponse = await client.querySelectorAll(pageId, 'p');
    if (querySelectorAllResponse.status !== 200) {
      throw new Error(`Failed to query selector all: ${querySelectorAllResponse.status}`);
    }
    const elementCount = querySelectorAllResponse.data.result;
    if (elementCount < 1) {
      throw new Error('Expected at least one p element');
    }
    console.log(`  ✓ Found ${elementCount} p element(s)`);
    
    // 10. Get element text
    console.log('  Step 10: Testing getElementText...');
    const elementTextResponse = await client.getElementText(pageId, 'h1');
    if (elementTextResponse.status !== 200) {
      throw new Error(`Failed to get element text: ${elementTextResponse.status}`);
    }
    const text = elementTextResponse.data.result;
    if (!text.includes('Example Domain')) {
      throw new Error(`Expected 'Example Domain', got '${text}'`);
    }
    console.log(`  ✓ Element text: "${text}"`);
    
    // 11. Get element attribute
    console.log('  Step 11: Testing getElementAttribute...');
    const attrResponse = await client.getElementAttribute(pageId, 'a', 'href');
    if (attrResponse.status !== 200) {
      throw new Error(`Failed to get element attribute: ${attrResponse.status}`);
    }
    console.log(`  ✓ Element attribute retrieved: ${attrResponse.data.result}`);
    
    // 12. Evaluate script
    console.log('  Step 12: Testing evaluate...');
    const evaluateResponse = await client.evaluate(pageId, 'document.title');
    if (evaluateResponse.status !== 200) {
      throw new Error(`Failed to evaluate: ${evaluateResponse.status}`);
    }
    const title = evaluateResponse.data.result;
    if (!title.includes('Example Domain')) {
      throw new Error(`Expected title 'Example Domain', got '${title}'`);
    }
    console.log(`  ✓ Script evaluated: "${title}"`);
    
    // 13. Take screenshot
    console.log('  Step 13: Taking screenshot...');
    const screenshotResponse = await client.screenshot(pageId);
    if (screenshotResponse.status !== 200) {
      throw new Error(`Failed to take screenshot: ${screenshotResponse.status}`);
    }
    const screenshotBuffer = Buffer.from(screenshotResponse.data);
    if (screenshotBuffer.length < 1000) {
      throw new Error('Screenshot seems too small');
    }
    console.log(`  ✓ Screenshot taken (${screenshotBuffer.length} bytes)`);
    
    // 14. Get context state
    console.log('  Step 14: Getting context storage state...');
    const stateResponse = await client.getContextState(contextId);
    if (stateResponse.status !== 200) {
      throw new Error(`Failed to get context state: ${stateResponse.status}`);
    }
    console.log('  ✓ Context state retrieved');
    
    // 15. Close page
    console.log('  Step 15: Closing page...');
    const closePageResponse = await client.closePage(pageId);
    if (closePageResponse.status !== 200) {
      throw new Error(`Failed to close page: ${closePageResponse.status}`);
    }
    console.log('  ✓ Page closed');
    pageId = null;
    
    // 16. Close context
    console.log('  Step 16: Closing context...');
    const closeContextResponse = await client.closeContext(contextId);
    if (closeContextResponse.status !== 200) {
      throw new Error(`Failed to close context: ${closeContextResponse.status}`);
    }
    console.log('  ✓ Context closed');
    contextId = null;
    
    // 17. Stop session
    console.log('  Step 17: Stopping session...');
    const stopResponse = await client.stopSession(sessionId);
    if (stopResponse.status !== 200) {
      throw new Error(`Failed to stop session: ${stopResponse.status}`);
    }
    console.log('  ✓ Session stopped');
    
    console.log('\n✓ Full browser workflow completed successfully');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Browser workflow failed:', error.message);
    throw error;
  } finally {
    // Cleanup in reverse order
    if (pageId) {
      try {
        await client.closePage(pageId);
      } catch (e) {
        // Ignore
      }
    }
    
    if (contextId) {
      try {
        await client.closeContext(contextId);
      } catch (e) {
        // Ignore
      }
    }
    
    if (sessionId) {
      try {
        await client.stopSession(sessionId);
      } catch (e) {
        // Ignore
      }
    }
  }
}

async function testMultipleContextsAndPages() {
  console.log('\n=== Testing Multiple Contexts and Pages ===');
  
  let sessionId: string | null = null;
  const contextIds: string[] = [];
  const pageIds: string[] = [];
  
  try {
    // Create and start session
    console.log('  Creating and starting session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    console.log('  ✓ Session ready');
    
    // Create multiple contexts
    console.log('  Creating 3 contexts...');
    for (let i = 0; i < 3; i++) {
      const response = await client.createContext(sessionId);
      contextIds.push(response.data.contextId);
    }
    console.log(`  ✓ Created ${contextIds.length} contexts`);
    
    // Create multiple pages in first context
    console.log('  Creating 3 pages in first context...');
    for (let i = 0; i < 3; i++) {
      const response = await client.createPage(contextIds[0]);
      pageIds.push(response.data.pageId);
    }
    console.log(`  ✓ Created ${pageIds.length} pages`);
    
    // Navigate pages to different URLs
    console.log('  Navigating pages...');
    await client.navigate(pageIds[0], 'https://example.com');
    await client.navigate(pageIds[1], 'https://www.iana.org');
    await sleep(2000);
    console.log('  ✓ Pages navigated');
    
    // Verify all contexts exist
    const contextsResponse = await client.getSessionContexts(sessionId);
    if (contextsResponse.data.contexts.length !== 3) {
      throw new Error(`Expected 3 contexts, got ${contextsResponse.data.contexts.length}`);
    }
    console.log('  ✓ All contexts verified');
    
    console.log('\n✓ Multiple contexts and pages test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Multiple contexts test failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    for (const pageId of pageIds) {
      try {
        await client.closePage(pageId);
      } catch (e) {
        // Ignore
      }
    }
    
    for (const contextId of contextIds) {
      try {
        await client.closeContext(contextId);
      } catch (e) {
        // Ignore
      }
    }
    
    if (sessionId) {
      try {
        await client.stopSession(sessionId);
      } catch (e) {
        // Ignore
      }
    }
  }
}

async function runTests() {
  console.log('Starting Browser Tests...');
  console.log('⚠ Note: These tests require Docker to be running');
  console.log('⚠ These tests will take several minutes to complete\n');
  
  try {
    await testFullBrowserWorkflow();
    await testMultipleContextsAndPages();
    
    console.log('\n=== All Browser Tests Passed ===\n');
  } catch (error) {
    console.error('\n=== Browser Tests Failed ===\n');
    process.exit(1);
  }
}

runTests();

