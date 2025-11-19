import { TestClient, sleep } from './setup';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function testFormInteractions() {
  console.log('\n=== Testing Form Interactions ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  
  try {
    // Setup
    console.log('  Setting up session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    if (!sessionId) throw new Error('Failed to create session');
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    if (!contextId) throw new Error('Failed to create context');
    
    const pageResponse = await client.createPage(contextId);
    pageId = pageResponse.data.pageId;
    if (!pageId) throw new Error('Failed to create page');
    console.log('  ✓ Setup complete');
    
    // Create a simple test page with form
    console.log('  Step 1: Creating test page with form...');
    await client.navigate(pageId, 'data:text/html,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Form</title></head>
        <body>
          <h1>Test Form Page</h1>
          <form id="testForm">
            <input type="text" id="username" name="username" placeholder="Username" />
            <input type="password" id="password" name="password" placeholder="Password" />
            <button type="submit" id="submitBtn">Submit</button>
          </form>
          <div id="result"></div>
          <script>
            document.getElementById('testForm').addEventListener('submit', function(e) {
              e.preventDefault();
              document.getElementById('result').textContent = 'Form submitted!';
            });
          </script>
        </body>
      </html>
    `));
    await sleep(1000);
    console.log('  ✓ Test page loaded');
    
    // Test typing into input fields
    console.log('  Step 2: Typing into username field...');
    await client.type(pageId, '#username', 'testuser');
    await sleep(500);
    
    const usernameValue = await client.evaluate(pageId, 
      'document.getElementById("username").value'
    );
    if (usernameValue.data.result !== 'testuser') {
      throw new Error(`Username not set correctly: ${usernameValue.data.result}`);
    }
    console.log('  ✓ Username typed successfully');
    
    // Test typing into password field
    console.log('  Step 3: Typing into password field...');
    await client.type(pageId, '#password', 'testpass123');
    await sleep(500);
    
    const passwordValue = await client.evaluate(pageId,
      'document.getElementById("password").value'
    );
    if (passwordValue.data.result !== 'testpass123') {
      throw new Error(`Password not set correctly: ${passwordValue.data.result}`);
    }
    console.log('  ✓ Password typed successfully');
    
    // Test clicking submit button
    console.log('  Step 4: Clicking submit button...');
    await client.click(pageId, '#submitBtn');
    await sleep(1000);
    
    const resultText = await client.getElementText(pageId, '#result');
    if (!resultText.data.result?.includes('Form submitted!')) {
      throw new Error('Form not submitted correctly');
    }
    console.log('  ✓ Button clicked and form submitted');
    
    console.log('\n✓ Form interactions test completed successfully');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Form interactions test failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    if (pageId !== null) await client.closePage(pageId).catch(() => {});
    if (contextId !== null) await client.closeContext(contextId).catch(() => {});
    if (sessionId !== null) await client.stopSession(sessionId).catch(() => {});
  }
}

async function testNavigationAndContent() {
  console.log('\n=== Testing Navigation and Content Extraction ===');
  
  let sessionId: string | null = null;
  let contextId: string | null = null;
  let pageId: string | null = null;
  
  try {
    // Setup
    console.log('  Setting up session...');
    const sessionResponse = await client.createSession();
    sessionId = sessionResponse.data.id;
    if (!sessionId) throw new Error('Failed to create session');
    await client.startSession(sessionId);
    await sleep(3000);
    
    const contextResponse = await client.createContext(sessionId);
    contextId = contextResponse.data.contextId;
    if (!contextId) throw new Error('Failed to create context');
    
    const pageResponse = await client.createPage(contextId);
    pageId = pageResponse.data.pageId;
    if (!pageId) throw new Error('Failed to create page');
    console.log('  ✓ Setup complete');
    
    // Create test page with various elements
    console.log('  Step 1: Loading test page...');
    await client.navigate(pageId, 'data:text/html,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Content Page</title></head>
        <body>
          <h1 class="title">Main Title</h1>
          <p class="description">This is a test paragraph.</p>
          <ul id="list">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
          <a href="https://example.com" id="testLink">Example Link</a>
          <div id="data-element" data-test="value123">Data Element</div>
        </body>
      </html>
    `));
    await sleep(1000);
    console.log('  ✓ Page loaded');
    
    // Test querySelector with different selectors
    console.log('  Step 2: Testing various selectors...');
    
    const h1Exists = await client.querySelector(pageId, 'h1.title');
    if (!h1Exists.data.result) {
      throw new Error('h1.title selector failed');
    }
    
    const linkExists = await client.querySelector(pageId, '#testLink');
    if (!linkExists.data.result) {
      throw new Error('#testLink selector failed');
    }
    
    const nonExistent = await client.querySelector(pageId, '.non-existent');
    if (nonExistent.data.result) {
      throw new Error('Non-existent selector should return false');
    }
    
    console.log('  ✓ Selectors working correctly');
    
    // Test querySelectorAll
    console.log('  Step 3: Testing querySelectorAll...');
    
    const liCount = await client.querySelectorAll(pageId, 'li');
    if (liCount.data.result !== 3) {
      throw new Error(`Expected 3 li elements, got ${liCount.data.result}`);
    }
    
    console.log('  ✓ Found correct number of elements');
    
    // Test getting text content
    console.log('  Step 4: Testing text extraction...');
    
    const titleText = await client.getElementText(pageId, 'h1');
    if (titleText.data.result !== 'Main Title') {
      throw new Error(`Expected 'Main Title', got '${titleText.data.result}'`);
    }
    
    const paraText = await client.getElementText(pageId, '.description');
    if (!paraText.data.result?.includes('test paragraph')) {
      throw new Error('Paragraph text not extracted correctly');
    }
    
    console.log('  ✓ Text content extracted correctly');
    
    // Test getting attributes
    console.log('  Step 5: Testing attribute extraction...');
    
    const href = await client.getElementAttribute(pageId, '#testLink', 'href');
    if (!href.data.result?.includes('example.com')) {
      throw new Error(`Expected href with 'example.com', got '${href.data.result}'`);
    }
    
    const dataAttr = await client.getElementAttribute(pageId, '#data-element', 'data-test');
    if (dataAttr.data.result !== 'value123') {
      throw new Error(`Expected 'value123', got '${dataAttr.data.result}'`);
    }
    
    console.log('  ✓ Attributes extracted correctly');
    
    // Test JavaScript evaluation
    console.log('  Step 6: Testing JavaScript evaluation...');
    
    const evalResult = await client.evaluate(pageId, `
      ({
        title: document.title,
        elementCount: document.querySelectorAll('*').length,
        listItems: Array.from(document.querySelectorAll('li')).map(li => li.textContent)
      })
    `);
    
    const result = evalResult.data.result;
    if (result.title !== 'Test Content Page') {
      throw new Error('Title not evaluated correctly');
    }
    
    if (result.listItems.length !== 3) {
      throw new Error('List items not evaluated correctly');
    }
    
    console.log('  ✓ JavaScript evaluated successfully');
    
    console.log('\n✓ Navigation and content test completed successfully');
    return true;
    
  } catch (error: any) {
    console.error('\n✗ Navigation and content test failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    if (pageId !== null) await client.closePage(pageId).catch(() => {});
    if (contextId !== null) await client.closeContext(contextId).catch(() => {});
    if (sessionId !== null) await client.stopSession(sessionId).catch(() => {});
  }
}

async function runTests() {
  console.log('Starting Interaction Tests...');
  console.log('⚠ Note: These tests require Docker to be running\n');
  
  try {
    await testFormInteractions();
    await testNavigationAndContent();
    
    console.log('\n=== All Interaction Tests Passed ===\n');
  } catch (error) {
    console.error('\n=== Interaction Tests Failed ===\n');
    process.exit(1);
  }
}

runTests();

