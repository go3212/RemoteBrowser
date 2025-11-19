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

### 2. Run Comprehensive Test Suite
```bash
npm test
# or
npm run test:comprehensive
```

This runs all test suites with a nice summary report.

## Test Structure

The test suite is organized into comprehensive test modules:

```
test/
├── setup.ts                    # Test utilities and helpers
├── quick-test.ts              # Fast smoke tests (~5 seconds)
├── health.test.ts             # Health check and auth tests (~10 seconds)
├── error-handling.test.ts     # Error scenarios (~10 seconds)
├── session.test.ts            # Session lifecycle tests (~60 seconds)
├── browser.test.ts            # Browser automation tests (~120 seconds)
├── interaction.test.ts        # User interaction tests (~90 seconds)
├── profiles.test.ts           # Profile & storage state tests (~90-120 seconds)
├── advanced.test.ts           # Advanced scenarios & stress tests (~120-180 seconds)
├── run-comprehensive.ts       # Comprehensive test runner with summary
├── run-all.ts                # Master test runner
├── README.md                  # Test documentation
└── COMPREHENSIVE_TESTS.md     # Complete test documentation
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

# Profile and storage state tests
npm run test:profiles

# Advanced tests (concurrent, stress, complex scenarios)
npm run test:advanced
```

### Complete Test Suite

#### Recommended: Comprehensive Runner (with nice summary)
```bash
npm test
# or
npm run test:comprehensive
```

#### Alternative: Run all tests sequentially
```bash
npm run test:all
```

**Duration:** ~8-12 minutes  
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

### Profile and Storage Tests (`test:profiles`)
- ✓ User profile workflow
- ✓ Storage state persistence
- ✓ Cookie persistence across contexts
- ✓ Context isolation
- ✓ Storage state transfer between contexts

### Advanced Tests (`test:advanced`)
- ✓ Concurrent sessions (3+ simultaneous)
- ✓ Large content handling (1000+ elements)
- ✓ Rapid page operations
- ✓ Complex CSS selectors (descendant, attribute, pseudo-class)
- ✓ Page lifecycle management
- ✓ Navigation scenarios (data URLs, about:blank, back-to-back)
- ✓ Stress testing

### C# Tests
Located in `clients/csharp/RemoteBrowserClient/Tests/`:
- ✓ 26 comprehensive tests covering all functionality
- ✓ All API endpoints and operations
- ✓ Error handling and edge cases
- ✓ Multiple contexts and pages
- ✓ Form interactions
- ✓ Storage state
- ✓ Full end-to-end workflows

Run with: `cd clients/csharp/RemoteBrowserClient && dotnet test`

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
| Error Tests | ~10-20s | No Docker startup |
| Session Tests | ~30-60s | Includes container startup |
| Browser Tests | ~60-120s | Full automation workflow |
| Interaction Tests | ~60-90s | Form interactions |
| Profile Tests | ~90-120s | Storage & isolation tests |
| Advanced Tests | ~120-180s | Concurrent & stress tests |
| **Full TypeScript Suite** | **~8-12 min** | All tests combined |
| **C# Test Suite** | **~5-10 min** | 26 comprehensive tests |
| **Total (Both)** | **~13-22 min** | Complete coverage |

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

## Completed Test Coverage

✅ **Complete test coverage achieved!**

The test suite now includes:
- ✅ All API endpoints (except file upload endpoints which require manual testing)
- ✅ Session lifecycle management
- ✅ Context and page operations
- ✅ Browser automation (navigation, clicks, typing)
- ✅ Content extraction and queries
- ✅ JavaScript evaluation (simple and complex)
- ✅ Screenshots
- ✅ Storage state and cookies
- ✅ Context isolation
- ✅ Error handling and edge cases
- ✅ Concurrent sessions
- ✅ Large content and rapid operations
- ✅ Complex CSS selectors
- ✅ Profile workflows
- ✅ C# client library (26 tests)

### Future Enhancements
- ⚠️ Profile import/export (requires file upload testing)
- ⚠️ Session import/export (requires file upload testing)
- 📝 Session timeout behavior (long-running tests)
- 📝 Load testing (high volume)
- 📝 WebSocket connectivity
- 📝 Visual regression tests for screenshots

## Additional Documentation

For complete test documentation, see:
- **test/COMPREHENSIVE_TESTS.md** - Full test documentation with all details
- **test/README.md** - Test overview
- **This file (TESTING.md)** - Quick reference guide

## Support

For issues or questions about testing:
1. Check the test output for detailed error messages
2. Review the test code for expected behavior
3. Check Docker logs: `docker logs <container-name>`
4. Verify server logs

