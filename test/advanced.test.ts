import { TestClient, sleep, waitForCondition } from './setup';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function testConcurrentSessions() {
  console.log('\n=== Testing Concurrent Sessions ===');
  
  const sessionIds: string[] = [];
  
  try {
    console.log('  Step 1: Creating 3 concurrent sessions...');
    
    // Create multiple sessions concurrently
    const sessionPromises = [
      client.createSession(),
      client.createSession(),
      client.createSession(),
    ];
    
    const responses = await Promise.all(sessionPromises);
    sessionIds.push(...responses.map(r => r.data.id));
    
    console.log(`  ✓ Created ${sessionIds.length} sessions concurrently`);
    
    // Start all sessions concurrently
    console.log('  Step 2: Starting all sessions concurrently (this may take 30-60s)...');
    const startPromises = sessionIds.map(id => client.startSession(id));
    await Promise.all(startPromises);
    console.log('  ✓ All sessions started');
    
    await sleep(3000);
    
    // Create contexts in each session
    console.log('  Step 3: Creating contexts in each session...');
    const contextPromises = sessionIds.map(id => client.createContext(id));
    const contextResponses = await Promise.all(contextPromises);
    const contextIds = contextResponses.map(r => r.data.contextId);
    console.log('  ✓ Created contexts in all sessions');
    
    // Create pages and navigate concurrently
    console.log('  Step 4: Creating pages and navigating...');
    const pagePromises = contextIds.map(cid => client.createPage(cid));
    const pageResponses = await Promise.all(pagePromises);
    const pageIds = pageResponses.map(r => r.data.pageId);
    
    const navigatePromises = pageIds.map((pid, i) => 
      client.navigate(pid, i === 0 ? 'https://example.com' : 
                           i === 1 ? 'https://www.iana.org' : 
                           'https://example.com')
    );
    await Promise.all(navigatePromises);
    console.log('  ✓ All pages navigated');
    
    await sleep(2000);
    
    // Verify all pages loaded
    console.log('  Step 5: Verifying all pages loaded correctly...');
    const contentPromises = pageIds.map(pid => client.getContent(pid));
    const contentResponses = await Promise.all(contentPromises);
    
    for (const response of contentResponses) {
      if (response.status !== 200) {
        throw new Error('Failed to get content from one or more pages');
      }
    }
    console.log('  ✓ All pages verified');
    
    // Cleanup
    console.log('  Step 6: Cleaning up...');
    await Promise.all(pageIds.map(pid => client.closePage(pid)));
    await Promise.all(contextIds.map(cid => client.closeContext(cid)));
    await Promise.all(sessionIds.map(sid => client.stopSession(sid)));
    console.log('  ✓ Cleanup complete');
    
    console.log('\n✓ Concurrent sessions test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Concurrent sessions test failed:', error.message);
    throw error;
  } finally {
    // Emergency cleanup
    for (const sid of sessionIds) {
      try {
        await client.stopSession(sid);
      } catch (e) {
        // Ignore
      }
    }
  }
}

async function testLargeContentHandling() {
  console.log('\n=== Testing Large Content Handling ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  
  try {
    console.log('  Setting up session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    
    const pageResponse = await client.createPage(contextId);
    pageId = pageResponse.data.pageId;
    
    // Create a page with large content
    console.log('  Step 1: Creating page with large content...');
    let largeContent = '<html><body><div>';
    for (let i = 0; i < 1000; i++) {
      largeContent += `<p>Paragraph ${i}: ${'Lorem ipsum dolor sit amet '.repeat(10)}</p>`;
    }
    largeContent += '</div></body></html>';
    
    await client.navigate(pageId, 'data:text/html,' + encodeURIComponent(largeContent));
    await sleep(2000);
    console.log('  ✓ Large content page loaded');
    
    // Get content back
    console.log('  Step 2: Retrieving large content...');
    const contentResponse = await client.getContent(pageId);
    if (contentResponse.status !== 200) {
      throw new Error('Failed to get large content');
    }
    
    const content = contentResponse.data;
    if (content.length < 10000) {
      throw new Error('Content seems too small');
    }
    console.log(`  ✓ Retrieved ${content.length} bytes of content`);
    
    // Query lots of elements
    console.log('  Step 3: Querying many elements...');
    const pCountResponse = await client.querySelectorAll(pageId, 'p');
    if (pCountResponse.data.result !== 1000) {
      throw new Error(`Expected 1000 paragraphs, got ${pCountResponse.data.result}`);
    }
    console.log('  ✓ Queried 1000 elements successfully');
    
    // Take screenshot of large page
    console.log('  Step 4: Taking screenshot of large page...');
    const screenshotResponse = await client.screenshot(pageId);
    if (screenshotResponse.status !== 200) {
      throw new Error('Failed to take screenshot');
    }
    console.log(`  ✓ Screenshot taken (${screenshotResponse.data.length} bytes)`);
    
    console.log('\n✓ Large content handling test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Large content handling test failed:', error.message);
    throw error;
  } finally {
    if (pageId) await client.closePage(pageId).catch(() => {});
    if (contextId) await client.closeContext(contextId).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function testRapidPageOperations() {
  console.log('\n=== Testing Rapid Page Operations ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  
  try {
    console.log('  Setting up session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    
    const pageResponse = await client.createPage(contextId);
    pageId = pageResponse.data.pageId;
    
    // Create test page
    await client.navigate(pageId, 'data:text/html,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <body>
          <input id="input1" type="text" />
          <input id="input2" type="text" />
          <input id="input3" type="text" />
          <button id="btn">Click Me</button>
          <div id="counter">0</div>
          <script>
            let count = 0;
            document.getElementById('btn').addEventListener('click', function() {
              count++;
              document.getElementById('counter').textContent = count;
            });
          </script>
        </body>
      </html>
    `));
    await sleep(1000);
    
    // Perform rapid operations
    console.log('  Step 1: Performing rapid typing operations...');
    await client.type(pageId, '#input1', 'text1');
    await client.type(pageId, '#input2', 'text2');
    await client.type(pageId, '#input3', 'text3');
    console.log('  ✓ Rapid typing completed');
    
    // Rapid clicks
    console.log('  Step 2: Performing rapid clicks...');
    for (let i = 0; i < 10; i++) {
      await client.click(pageId, '#btn');
      await sleep(100);
    }
    await sleep(500);
    
    const counter = await client.getElementText(pageId, '#counter');
    if (!counter.data.result?.includes('10')) {
      throw new Error(`Expected counter to be 10, got ${counter.data.result}`);
    }
    console.log('  ✓ Rapid clicks completed');
    
    // Rapid evaluations
    console.log('  Step 3: Performing rapid evaluations...');
    const evalPromises = [];
    for (let i = 0; i < 20; i++) {
      evalPromises.push(client.evaluate(pageId, `${i} * 2`));
    }
    const results = await Promise.all(evalPromises);
    
    for (let i = 0; i < 20; i++) {
      if (results[i].data.result !== i * 2) {
        throw new Error(`Evaluation ${i} failed`);
      }
    }
    console.log('  ✓ Rapid evaluations completed');
    
    console.log('\n✓ Rapid page operations test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Rapid page operations test failed:', error.message);
    throw error;
  } finally {
    if (pageId) await client.closePage(pageId).catch(() => {});
    if (contextId) await client.closeContext(contextId).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function testComplexSelectors() {
  console.log('\n=== Testing Complex Selectors ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  
  try {
    console.log('  Setting up session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    
    const pageResponse = await client.createPage(contextId);
    pageId = pageResponse.data.pageId;
    
    // Create complex HTML structure
    await client.navigate(pageId, 'data:text/html,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="item" data-id="1">
              <span class="title">Item 1</span>
              <span class="price">$10</span>
            </div>
            <div class="item" data-id="2">
              <span class="title">Item 2</span>
              <span class="price">$20</span>
            </div>
            <div class="item special" data-id="3">
              <span class="title">Special Item</span>
              <span class="price">$30</span>
            </div>
          </div>
          <ul id="list">
            <li class="active">First</li>
            <li>Second</li>
            <li class="active">Third</li>
          </ul>
        </body>
      </html>
    `));
    await sleep(1000);
    
    // Test various complex selectors
    console.log('  Testing various complex selectors...');
    
    // Descendant selector
    const titleExists = await client.querySelector(pageId, '.container .title');
    if (!titleExists.data.result) throw new Error('Descendant selector failed');
    
    // Attribute selector
    const item3Exists = await client.querySelector(pageId, '[data-id="3"]');
    if (!item3Exists.data.result) throw new Error('Attribute selector failed');
    
    // Multiple classes
    const specialItem = await client.querySelector(pageId, '.item.special');
    if (!specialItem.data.result) throw new Error('Multiple class selector failed');
    
    // Pseudo-class (using querySelectorAll to count)
    const activeCount = await client.querySelectorAll(pageId, '.active');
    if (activeCount.data.result !== 2) throw new Error('Pseudo-class selector failed');
    
    // Child selector
    const items = await client.querySelectorAll(pageId, '.container > .item');
    if (items.data.result !== 3) throw new Error('Child selector failed');
    
    // Get text from specific item
    const specialText = await client.getElementText(pageId, '[data-id="3"] .title');
    if (!specialText.data.result?.includes('Special Item')) {
      throw new Error('Complex text selector failed');
    }
    
    console.log('  ✓ All complex selectors working');
    
    console.log('\n✓ Complex selectors test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Complex selectors test failed:', error.message);
    throw error;
  } finally {
    if (pageId) await client.closePage(pageId).catch(() => {});
    if (contextId) await client.closeContext(contextId).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function testPageLifecycle() {
  console.log('\n=== Testing Page Lifecycle ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  const pageIds: string[] = [];
  
  try {
    console.log('  Setting up session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    
    // Create, use, and close multiple pages in sequence
    console.log('  Step 1: Creating and closing pages in sequence...');
    for (let i = 0; i < 5; i++) {
      const pageResponse = await client.createPage(contextId);
      const pageId = pageResponse.data.pageId;
      pageIds.push(pageId);
      
      await client.navigate(pageId, `https://example.com`);
      await sleep(500);
      
      const content = await client.getContent(pageId);
      if (content.status !== 200) {
        throw new Error(`Page ${i} failed to load`);
      }
      
      await client.closePage(pageId);
      await sleep(200);
    }
    console.log('  ✓ Created and closed 5 pages successfully');
    
    // Create multiple pages and close them all at once
    console.log('  Step 2: Creating multiple pages and closing all at once...');
    const newPageIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const pageResponse = await client.createPage(contextId);
      newPageIds.push(pageResponse.data.pageId);
    }
    
    // Close all at once
    await Promise.all(newPageIds.map(pid => client.closePage(pid)));
    console.log('  ✓ Batch closed 3 pages');
    
    console.log('\n✓ Page lifecycle test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Page lifecycle test failed:', error.message);
    throw error;
  } finally {
    // Cleanup any remaining pages
    for (const pid of pageIds) {
      try {
        await client.closePage(pid);
      } catch (e) {
        // Ignore
      }
    }
    if (contextId) await client.closeContext(contextId).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function testNavigationScenarios() {
  console.log('\n=== Testing Navigation Scenarios ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  
  try {
    console.log('  Setting up session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    
    const pageResponse = await client.createPage(contextId);
    pageId = pageResponse.data.pageId;
    
    // Test data URL navigation
    console.log('  Step 1: Testing data URL navigation...');
    await client.navigate(pageId, 'data:text/html,<html><body><h1>Data URL</h1></body></html>');
    await sleep(500);
    
    let content = await client.getContent(pageId);
    if (!content.data.includes('Data URL')) {
      throw new Error('Data URL navigation failed');
    }
    console.log('  ✓ Data URL navigation works');
    
    // Test about:blank navigation
    console.log('  Step 2: Testing about:blank navigation...');
    await client.navigate(pageId, 'about:blank');
    await sleep(500);
    content = await client.getContent(pageId);
    console.log('  ✓ about:blank navigation works');
    
    // Test back-to-back navigation
    console.log('  Step 3: Testing rapid navigation...');
    await client.navigate(pageId, 'https://example.com');
    await sleep(1000);
    await client.navigate(pageId, 'data:text/html,<html><body>Second page</body></html>');
    await sleep(1000);
    
    content = await client.getContent(pageId);
    if (!content.data.includes('Second page')) {
      throw new Error('Second navigation failed');
    }
    console.log('  ✓ Rapid navigation works');
    
    console.log('\n✓ Navigation scenarios test completed');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Navigation scenarios test failed:', error.message);
    throw error;
  } finally {
    if (pageId) await client.closePage(pageId).catch(() => {});
    if (contextId) await client.closeContext(contextId).catch(() => {});
    if (sessionId) await client.stopSession(sessionId).catch(() => {});
  }
}

async function runTests() {
  console.log('Starting Advanced Tests...');
  console.log('⚠ Note: These tests require Docker to be running');
  console.log('⚠ Some tests may take several minutes to complete\n');
  
  try {
    await testComplexSelectors();
    await testLargeContentHandling();
    await testRapidPageOperations();
    await testPageLifecycle();
    await testNavigationScenarios();
    
    // This test is very slow, run it last
    console.log('\n⚠ Starting concurrent sessions test (this will take 1-2 minutes)...');
    await testConcurrentSessions();
    
    console.log('\n=== All Advanced Tests Passed ===\n');
  } catch (error) {
    console.error('\n=== Advanced Tests Failed ===\n');
    process.exit(1);
  }
}

runTests();

