# Remote Browser Server Tests

Comprehensive integration tests for the Remote Browser orchestrator server.

## Prerequisites

- Docker must be running
- Server must be running on the configured port (default: 3000)
- Network access to pull Docker images (first run only)

## Test Suites

### 1. Health Check Tests (`health.test.ts`)
Tests the health check endpoint and authentication.

```bash
npm run test:health
```

**Tests:**
- Basic health check
- Authentication with correct password
- Authentication rejection with wrong password
- Authentication rejection without credentials

### 2. Session Tests (`session.test.ts`)
Tests session lifecycle management.

```bash
npm run test:session
```

**Tests:**
- Creating sessions
- Getting session details
- Starting sessions (Docker container creation)
- Stopping sessions
- Session with custom launch options
- Session timeout configuration

### 3. Browser Tests (`browser.test.ts`)
Tests browser automation functionality.

```bash
npm run test:browser
```

**Tests:**
- Full workflow: session → context → page → actions
- Multiple contexts per session
- Multiple pages per context
- Navigation
- Content retrieval
- DOM querying (querySelector, querySelectorAll)
- Element text extraction
- Element attribute extraction
- JavaScript evaluation
- Screenshots
- Context storage state

### 4. Interaction Tests (`interaction.test.ts`)
Tests user interaction simulation.

```bash
npm run test:interaction
```

**Tests:**
- Form filling (typing into inputs)
- Button clicking
- Form submission
- Content verification after interactions
- Various CSS selectors
- Data attributes

### 5. Error Handling Tests (`error-handling.test.ts`)
Tests error scenarios and edge cases.

```bash
npm run test:error
```

**Tests:**
- Operations on non-existent sessions
- Operations on non-existent pages
- Operations on non-existent contexts
- Malformed requests
- Invalid parameters
- Operations on inactive sessions

## Running Tests

### Run All Tests
```bash
npm run test:all
```

### Run Individual Test Suites
```bash
npm run test:health
npm run test:session
npm run test:browser
npm run test:interaction
npm run test:error
```

### Run Tests with Authentication
```bash
AUTH_PASSWORD=your-password npm run test:all
```

## Test Output

Tests provide detailed console output showing:
- ✓ Passed tests with details
- ✗ Failed tests with error messages
- ⊘ Skipped tests with reasons
- Step-by-step progress for complex workflows

Example output:
```
=== Testing Full Browser Workflow ===
  Step 1: Creating session...
  ✓ Session created: abc-123
  Step 2: Starting session (this may take a while)...
  ✓ Session started
  ...
✓ Full browser workflow completed successfully
```

## Performance Notes

- **Health tests**: Fast (< 1 second)
- **Session tests**: Moderate (30-60 seconds) - includes Docker container startup
- **Browser tests**: Slow (2-5 minutes) - includes full browser automation
- **Interaction tests**: Moderate (1-2 minutes)
- **Error tests**: Fast (< 10 seconds)

## Cleanup

Tests automatically clean up resources (sessions, contexts, pages) even if they fail. However, if a test is forcefully terminated, you may need to manually stop Docker containers:

```bash
docker ps | grep remote-browser-worker
docker stop <container-name>
```

## Troubleshooting

### Docker Not Running
```
Error: Docker not available
```
**Solution**: Start Docker Desktop or Docker daemon

### Port Already in Use
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure server is running on the expected port

### Container Startup Timeout
```
Error: Browser failed to start
```
**Solution**: Check Docker resources (memory, CPU). Container may take longer on slower systems.

### Authentication Failures
```
Error: 401 Unauthorized
```
**Solution**: Set AUTH_PASSWORD environment variable if server has authentication enabled

## Writing New Tests

Use the `TestClient` helper class from `setup.ts`:

```typescript
import { TestClient, sleep } from './setup';

const client = new TestClient(undefined, process.env.AUTH_PASSWORD);

async function myTest() {
  const session = await client.createSession();
  // ... test logic
  await client.stopSession(session.data.id);
}
```

Always include cleanup in `finally` blocks to prevent resource leaks.
