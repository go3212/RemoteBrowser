# Testing Guide for Remote Browser Server

This document provides a comprehensive guide to testing the Remote Browser orchestrator server.

## Quick Start

### 1. Ensure Prerequisites
```bash
# Start Docker (if not running)
# Start the server
npm start

# In a new terminal, run quick smoke test
npm run test:quick
```

### 2. Run Full Test Suite
```bash
npm test
```

## Test Structure

The test suite is organized into multiple levels:

```
test/
├── setup.ts              # Test utilities and helpers
├── quick-test.ts         # Fast smoke tests (~5 seconds)
├── health.test.ts        # Health check and auth tests (~10 seconds)
├── error-handling.test.ts # Error scenarios (~10 seconds)
├── session.test.ts       # Session lifecycle tests (~60 seconds)
├── browser.test.ts       # Browser automation tests (~120 seconds)
├── interaction.test.ts   # User interaction tests (~90 seconds)
├── run-all.ts           # Master test runner with summary
└── README.md            # Detailed test documentation
```

## Test Commands

### Quick Smoke Test (Recommended for Development)
```bash
npm run test:quick
```
Runs basic connectivity and functionality tests. Perfect for quick validation during development.

**Tests:**
- Server health check
- Session creation
- Session retrieval
- Error handling

**Duration:** ~5 seconds

### Individual Test Suites

```bash
# Health checks and authentication
npm run test:health

# Error handling and edge cases
npm run test:error

# Session management
npm run test:session

# Browser automation features
npm run test:browser

# User interactions (forms, clicks, etc.)
npm run test:interaction
```

### Complete Test Suite
```bash
npm run test:all
# or simply
npm test
```

**Duration:** ~5-10 minutes  
**Note:** Requires Docker to be running

## Test Coverage

### Health Tests (`test:health`)
- ✓ Basic health endpoint
- ✓ Authentication with valid credentials
- ✓ Authentication rejection without credentials
- ✓ Authentication rejection with wrong password

### Error Handling Tests (`test:error`)
- ✓ Invalid session operations
- ✓ Invalid page operations
- ✓ Invalid context operations
- ✓ Malformed request handling

### Session Tests (`test:session`)
- ✓ Session creation
- ✓ Session retrieval
- ✓ Session not found (404)
- ✓ Starting session (Docker container)
- ✓ Stopping session
- ✓ Session with custom launch options
- ✓ Session with custom timeout

### Browser Tests (`test:browser`)
- ✓ Full workflow (session → context → page → actions)
- ✓ Multiple contexts per session
- ✓ Multiple pages per context
- ✓ Page navigation
- ✓ Content retrieval
- ✓ DOM querying (querySelector/All)
- ✓ Element text extraction
- ✓ Element attribute extraction
- ✓ JavaScript evaluation
- ✓ Screenshots
- ✓ Storage state management

### Interaction Tests (`test:interaction`)
- ✓ Form input (typing)
- ✓ Button clicks
- ✓ Form submission
- ✓ CSS selectors (various types)
- ✓ Data attributes
- ✓ Content verification after interactions

## Environment Variables

### Required
None for basic tests

### Optional
```bash
# Enable authentication testing
AUTH_PASSWORD=your-password npm test

# Custom server port
PORT=8080 npm test

# Custom base URL for tests
TEST_BASE_URL=http://localhost:8080 npm test
```

## Continuous Integration

A GitHub Actions workflow is included at `.github/workflows/test.yml` that:
- Runs on push to main/develop branches
- Runs on pull requests
- Sets up Node.js and Docker
- Builds the worker image
- Runs all test suites with timeouts
- Reports results

## Writing New Tests

### Using the TestClient Helper

```typescript
import { TestClient, sleep } from './setup';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function myTest() {
  let sessionId: string | null = null;
  
  try {
    // Create session
    const response = await client.createSession();
    sessionId = response.data.id;
    if (!sessionId) throw new Error('Failed to create session');
    
    // Your test logic here
    
    console.log('✓ Test passed');
    
  } catch (error: any) {
    console.error('✗ Test failed:', error.message);
    throw error;
  } finally {
    // Always cleanup
    if (sessionId !== null) {
      await client.stopSession(sessionId).catch(() => {});
    }
  }
}
```

### Best Practices

1. **Always cleanup resources** in `finally` blocks
2. **Add type guards** after assignments: `if (!sessionId) throw new Error(...)`
3. **Use descriptive test names** and console output
4. **Add delays** when needed: `await sleep(1000)`
5. **Handle failures gracefully** in cleanup
6. **Test both success and failure paths**

### Available TestClient Methods

```typescript
// Session operations
client.healthCheck()
client.createSession(options?)
client.startSession(sessionId)
client.getSession(sessionId)
client.stopSession(sessionId)

// Context operations
client.createContext(sessionId, storageState?)
client.getSessionContexts(sessionId)
client.getContextState(contextId)
client.closeContext(contextId)

// Page operations
client.createPage(contextId)
client.closePage(pageId)
client.navigate(pageId, url)
client.getContent(pageId)
client.screenshot(pageId)

// Interactions
client.click(pageId, selector)
client.type(pageId, selector, text)
client.querySelector(pageId, selector)
client.querySelectorAll(pageId, selector)
client.getElementText(pageId, selector)
client.getElementAttribute(pageId, selector, attribute)
client.evaluate(pageId, script)
```

## Troubleshooting

### Tests Hanging
- Check if Docker is running
- Check if server is running
- Verify port is not blocked
- Check Docker resources (memory/CPU)

### Authentication Errors
- Ensure AUTH_PASSWORD matches server configuration
- Check Authorization header format

### Container Startup Timeouts
- Increase `sleep()` durations in tests
- Check Docker performance
- Verify worker image is built: `npm run build:worker`

### Network Errors
- Verify server is accessible: `curl http://localhost:3000/health`
- Check firewall settings
- Verify port configuration

## Performance Benchmarks

Typical execution times on a modern development machine:

| Test Suite | Duration | Notes |
|-----------|----------|-------|
| Quick Test | ~5s | No Docker startup |
| Health Tests | ~10s | No Docker startup |
| Error Tests | ~10s | No Docker startup |
| Session Tests | ~60s | Includes container startup |
| Browser Tests | ~120s | Full automation workflow |
| Interaction Tests | ~90s | Form interactions |
| **Full Suite** | **~300s** | All tests combined |

## Test Output Example

```
╔════════════════════════════════════════════════════════════╗
║     Remote Browser Server - Complete Test Suite          ║
╚════════════════════════════════════════════════════════════╝

[1/5] Running Health Check...
─────────────────────────────────────────────────────────────

=== Testing Health Check ===
✓ Health check passed
  Orchestrator ID: orch-1234567890-abc

✓ Health Check PASSED (0.5s)

[2/5] Running Error Handling...
...

╔════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                         ║
╚════════════════════════════════════════════════════════════╝

  ✓ PASS  Health Check                       0.5s
  ✓ PASS  Error Handling                     8.2s
  ✓ PASS  Session Management                58.4s
  ✓ PASS  Browser Operations               124.7s
  ✓ PASS  User Interactions                 87.3s

─────────────────────────────────────────────────────────────
  Total: 5/5 test suites passed
  Duration: 279.1s

✓ All tests passed successfully!
```

## Next Steps

- Add tests for profile import/export functionality
- Add tests for session timeout behavior
- Add performance/load tests
- Add tests for concurrent sessions
- Add tests for WebSocket connectivity
- Add visual regression tests for screenshots

## Support

For issues or questions about testing:
1. Check the test output for detailed error messages
2. Review the test code for expected behavior
3. Check Docker logs: `docker logs <container-name>`
4. Verify server logs

