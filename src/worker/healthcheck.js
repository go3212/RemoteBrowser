const http = require('http');

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL;
const ORCHESTRATOR_ID = process.env.ORCHESTRATOR_ID;
// Default to localhost:3000 if not set, but orchestrator passes it.
// Note: In Docker, we need to be careful about what 'localhost' means if ORCHESTRATOR_URL is not properly set.

if (!ORCHESTRATOR_URL || !ORCHESTRATOR_ID) {
  console.error('Healthcheck: Missing ORCHESTRATOR_URL or ORCHESTRATOR_ID. Exiting.');
  // If we can't check health, we shouldn't run?
  // But maybe we are running manually?
  // Let's just log and do nothing if vars are missing, or exit.
  // The requirement says "Reads env vars... if unreachable... kills itself".
  process.kill(1, 'SIGTERM');
}

console.log(`Healthcheck: Monitoring ${ORCHESTRATOR_URL} for ID ${ORCHESTRATOR_ID}`);

let failCount = 0;
const MAX_FAILS = 3;

function check() {
  const req = http.get(`${ORCHESTRATOR_URL}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        if (res.statusCode !== 200) {
             console.error(`Healthcheck: Received status ${res.statusCode}`);
             handleFail();
             return;
        }
        const json = JSON.parse(data);
        if (json.orchestratorId !== ORCHESTRATOR_ID) {
          console.error(`Healthcheck: Orchestrator ID mismatch! Expected ${ORCHESTRATOR_ID}, got ${json.orchestratorId}. shutting down.`);
          process.kill(1, 'SIGTERM');
        } else {
            failCount = 0; // Reset on success
        }
      } catch (e) {
        console.error(`Healthcheck: Error parsing response: ${e.message}`);
        handleFail();
      }
    });
  });

  req.on('error', (e) => {
     console.error(`Healthcheck: Connection error: ${e.message}`);
     handleFail();
  });
  
  req.setTimeout(2000, () => {
      req.destroy();
      console.error('Healthcheck: Timeout');
      handleFail();
  });
}

function handleFail() {
    failCount++;
    if (failCount >= MAX_FAILS) {
        console.error(`Healthcheck: Too many failures (${failCount}). Shutting down.`);
        process.kill(1, 'SIGTERM');
    }
}

setInterval(check, 5000);

