# Comprehensive Test Suite

This document describes the complete test suite for the Remote Browser Orchestrator.

## Test Structure

### TypeScript Tests (Node.js)

#### 1. Health Check Tests (`health.test.ts`)
- **Purpose**: Verify server health and authentication
- **Tests**:
  - Basic health check endpoint
  - Authentication with password
  - Rejection of invalid credentials
- **Duration**: < 5 seconds

#### 2. Session Tests (`session.test.ts`)
- **Purpose**: Test session lifecycle management
- **Tests**:
  - Create session
  - Get session by ID
  - Get non-existent session (404)
  - Start session (Docker container launch)
  - Stop session
  - Create session with launch options
- **Duration**: 30-60 seconds

#### 3. Browser Tests (`browser.test.ts`)
- **Purpose**: Test full browser automation workflow
- **Tests**:
  - Complete workflow: session → context → page → navigate → interact
  - Multiple contexts and pages
  - Context management
  - Page operations
  - Screenshots
  - JavaScript evaluation
  - Query selectors
- **Duration**: 60-120 seconds

#### 4. Interaction Tests (`interaction.test.ts`)
- **Purpose**: Test user interactions with web pages
- **Tests**:
  - Form interactions (type, click, submit)
  - Navigation and content extraction
  - Element selectors (ID, class, tag, attribute)
  - Text and attribute extraction
  - Complex JavaScript evaluation
- **Duration**: 60-90 seconds

#### 5. Error Handling Tests (`error-handling.test.ts`)
- **Purpose**: Test error conditions and edge cases
- **Tests**:
  - Invalid session operations
  - Invalid page operations
  - Invalid context operations
  - Malformed requests
- **Duration**: 10-20 seconds

#### 6. Profile and Storage Tests (`profiles.test.ts`)
- **Purpose**: Test storage state and profile management
- **Tests**:
  - User profile workflow
  - Storage state persistence
  - Cookie persistence across contexts
  - Context isolation
- **Duration**: 90-120 seconds

#### 7. Advanced Tests (`advanced.test.ts`)
- **Purpose**: Test advanced scenarios and performance
- **Tests**:
  - Concurrent sessions (3 sessions simultaneously)
  - Large content handling (1000+ elements)
  - Rapid page operations
  - Complex CSS selectors
  - Page lifecycle management
  - Various navigation scenarios
- **Duration**: 120-180 seconds

### C# Tests (.NET 8.0)

#### RemoteBrowserClientTests (`RemoteBrowserClientTests.cs`)
Comprehensive test suite with 26 tests organized in sections:

##### Basic Session Operations
- `Test01_CreateSession_ShouldReturnValidSession`
- `Test02_CreateSessionWithOptions_ShouldWork`
- `Test03_GetContexts_ShouldReturnEmptyListInitially`
- `Test04_GetContexts_ShouldReturnCreatedContexts`

##### Context Operations
- `Test05_CreateContext_ShouldReturnValidContext`
- `Test06_GetStorageState_ShouldReturnState`
- `Test07_CloseContext_ShouldRemoveFromContextList`

##### Page Operations
- `Test08_CreatePage_ShouldReturnValidPage`
- `Test09_Navigate_ShouldLoadPage`
- `Test10_GetContent_ShouldReturnHtml`
- `Test11_Screenshot_ShouldReturnImageData`
- `Test12_Evaluate_ShouldExecuteJavaScript`
- `Test13_EvaluateComplex_ShouldReturnObject`

##### Selector Operations
- `Test14_QuerySelector_ShouldFindExistingElement`
- `Test15_QuerySelector_ShouldReturnFalseForNonExistent`
- `Test16_QuerySelectorAll_ShouldReturnCount`
- `Test17_GetElementText_ShouldReturnText`
- `Test18_GetElementAttribute_ShouldReturnAttribute`

##### Form Interactions
- `Test19_TypeAndClick_ShouldInteractWithForm`

##### Multiple Contexts and Pages
- `Test20_MultipleContexts_ShouldWorkIndependently`
- `Test21_MultiplePagesInContext_ShouldWork`

##### Advanced Scenarios
- `Test22_ComplexJavaScriptEvaluation_ShouldWork`
- `Test23_NavigateMultipleTimes_ShouldWork`
- `Test24_DifferentSelectors_ShouldAllWork`

##### Storage State / Cookies
- `Test25_StorageState_ShouldPersistCookies`

##### Full End-to-End
- `Test26_FullWorkflow_AllOperations` - Tests all operations in sequence

**Duration**: 5-10 minutes (depending on Docker startup time)

## Running Tests

### TypeScript Tests

Run all tests:
```bash
npm test
```

Run individual test suites:
```bash
npm run test:health
npm run test:session
npm run test:browser
npm run test:interaction
npm run test:error
npm run test:profiles
npm run test:advanced
```

Run quick test (subset):
```bash
npm run test:quick
```

### C# Tests

Prerequisites:
```bash
cd clients/csharp/RemoteBrowserClient
dotnet restore
```

Run tests:
```bash
dotnet test
```

Run specific test:
```bash
dotnet test --filter "FullyQualifiedName~Test01_CreateSession"
```

## Prerequisites

### For All Tests
- Docker must be running
- Remote Browser Orchestrator server must be running (for remote tests)
- OR run against localhost (change BaseUrl in test files)

### Environment Variables
```bash
# Optional: Set authentication password
export REMOTE_BROWSER_PASSWORD="your-password"
export AUTH_PASSWORD="your-password"
```

### TypeScript Tests
- Node.js 18+ or Bun
- Dependencies installed: `npm install`

### C# Tests
- .NET 8.0 SDK
- Xunit test framework (included via NuGet)

## Test Coverage

### API Endpoints Tested

#### Session Management
- ✅ `POST /sessions` - Create session
- ✅ `POST /sessions/:id/start` - Start session
- ✅ `DELETE /sessions/:id` - Stop session
- ✅ `GET /sessions/:id` - Get session info
- ⚠️  `POST /sessions/import` - Import session (manual test needed)

#### Context Management
- ✅ `POST /sessions/:id/contexts` - Create context
- ✅ `GET /sessions/:id/contexts` - List contexts
- ✅ `GET /contexts/:contextId/storageState` - Get storage state
- ✅ `DELETE /contexts/:contextId` - Close context

#### Page Management
- ✅ `POST /contexts/:contextId/pages` - Create page
- ✅ `DELETE /pages/:pageId` - Close page

#### Page Actions
- ✅ `POST /pages/:pageId/navigate` - Navigate to URL
- ✅ `POST /pages/:pageId/click` - Click element
- ✅ `POST /pages/:pageId/type` - Type into element
- ✅ `GET /pages/:pageId/screenshot` - Take screenshot
- ✅ `POST /pages/:pageId/evaluate` - Evaluate JavaScript
- ✅ `GET /pages/:pageId/content` - Get page HTML
- ✅ `POST /pages/:pageId/querySelector` - Query single element
- ✅ `POST /pages/:pageId/querySelectorAll` - Query multiple elements
- ✅ `POST /pages/:pageId/elementText` - Get element text
- ✅ `POST /pages/:pageId/elementAttribute` - Get element attribute

#### Profile Management
- ⚠️  `POST /profiles/import` - Import user profile (manual test needed)
- ⚠️  `GET /profiles/:name/export` - Export user profile (manual test needed)

#### Health
- ✅ `GET /health` - Health check

### Functionality Tested

- ✅ Session lifecycle (create, start, stop)
- ✅ Context management (create, close, list)
- ✅ Page management (create, close)
- ✅ Navigation (HTTP, HTTPS, data URLs, about:blank)
- ✅ User interactions (click, type)
- ✅ Content extraction (HTML, text, attributes)
- ✅ Element queries (querySelector, querySelectorAll)
- ✅ Screenshots
- ✅ JavaScript evaluation (simple and complex)
- ✅ Storage state persistence
- ✅ Cookie management
- ✅ Context isolation
- ✅ Multiple contexts per session
- ✅ Multiple pages per context
- ✅ Concurrent sessions
- ✅ Large content handling
- ✅ Rapid operations
- ✅ Complex CSS selectors
- ✅ Error handling
- ✅ Authentication

### Not Yet Tested (Manual Testing Required)

- ⚠️  Session import/export (file upload)
- ⚠️  User profile import/export (file upload)
- ⚠️  Session timeout behavior
- ⚠️  Resource limits
- ⚠️  Network throttling
- ⚠️  Geolocation
- ⚠️  Device emulation

## Test Results Interpretation

### Success Criteria
- All tests pass with status 200 (or expected status codes)
- No uncaught exceptions
- Proper cleanup (all resources closed)
- Expected content in responses

### Common Failure Reasons
1. **Docker not running**: Tests will fail to start sessions
2. **Port conflicts**: Server not accessible on expected port
3. **Timeout**: Docker container takes too long to start (increase wait time)
4. **Authentication failure**: Wrong or missing password
5. **Resource exhaustion**: Too many concurrent sessions

## Continuous Integration

### GitHub Actions (Example)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      docker:
        image: docker:dind
        
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run TypeScript tests
      run: npm test
      env:
        AUTH_PASSWORD: ${{ secrets.REMOTE_BROWSER_PASSWORD }}
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0.x'
    
    - name: Run C# tests
      run: |
        cd clients/csharp/RemoteBrowserClient
        dotnet restore
        dotnet test
      env:
        REMOTE_BROWSER_PASSWORD: ${{ secrets.REMOTE_BROWSER_PASSWORD }}
```

## Test Maintenance

### Adding New Tests
1. Follow existing test patterns
2. Ensure proper cleanup in `finally` blocks
3. Add descriptive test names and console logs
4. Update this documentation
5. Add to appropriate test script in `package.json`

### Debugging Tests
- Set longer timeouts with `await sleep(ms)` 
- Check Docker logs: `docker logs <container-name>`
- Use browser in non-headless mode for visual debugging
- Add more console.log statements for debugging

## Performance Benchmarks

Based on test runs (approximate times):

| Test Suite | Duration | Notes |
|------------|----------|-------|
| Health | < 5s | Fast, no Docker |
| Session | 30-60s | Docker startup |
| Browser | 60-120s | Full workflow |
| Interaction | 60-90s | Multiple pages |
| Error Handling | 10-20s | Quick validation |
| Profiles | 90-120s | Multiple contexts |
| Advanced | 120-180s | Concurrent, stress tests |
| C# Full Suite | 5-10m | All 26 tests |

**Total TypeScript Test Time**: ~8-12 minutes  
**Total C# Test Time**: ~5-10 minutes  
**Combined**: ~13-22 minutes

## Troubleshooting

### Tests Timeout
- Increase Docker memory allocation
- Increase wait times in tests
- Check Docker container logs
- Ensure no port conflicts

### Random Failures
- Docker resource constraints
- Network issues
- Timing issues (increase sleep duration)

### All Tests Fail
- Check if server is running
- Verify authentication credentials
- Ensure Docker is running
- Check firewall settings

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure tests are isolated (no dependencies between tests)
3. Clean up resources properly
4. Add tests to appropriate suite
5. Update documentation

