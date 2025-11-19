const http = require('http');
const { execSync } = require('child_process');

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL;
const ORCHESTRATOR_ID = process.env.ORCHESTRATOR_ID;

function killContainer() {
  console.error('Healthcheck: Killing container...');
  try {
    // Kill all processes in the container (PID 1 and all children)
    execSync('kill -TERM 1');
  } catch (e) {
    // If we can't kill PID 1, kill all node processes as fallback
    try {
      execSync('pkill -TERM node');
    } catch (e2) {
      // Last resort: exit with error code (container should restart or stop)
      process.exit(1);
    }
  }
}

if (!ORCHESTRATOR_URL || !ORCHESTRATOR_ID) {
  console.error('Healthcheck: Missing ORCHESTRATOR_URL or ORCHESTRATOR_ID. Exiting.');
  killContainer();
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
          console.error(`Healthcheck: Orchestrator ID mismatch! Expected ${ORCHESTRATOR_ID}, got ${json.orchestratorId}. Shutting down.`);
          killContainer();
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
        killContainer();
    }
}

setInterval(check, 5000);

