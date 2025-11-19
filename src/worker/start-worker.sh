#!/bin/bash
echo "Starting Worker Wrapper..."

# Run healthcheck in background
node /healthcheck.js &

# Pass through environment variables that control launch arguments
# BROWSERLESS/Chrome usually respects specific env vars or we might need to adjust how we call it.
# However, standard browserless docker images look at env vars like:
# SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_DEPTH, CONNECTION_TIMEOUT, ENABLE_DEBUGGER, PREBOOT_CHROME, KEEP_ALIVE
# But for specific launch args (like --window-size, --disable-gpu), they are often passed in the connection URL or
# via the `LAUNCH_ARGS` env var if the underlying runner supports it.

# Since we are using `playwright-core` or `puppeteer` inside the container (via browserless), 
# we can try to pass specific args if the base image supports custom launch args.
# Looking at browserless docs, `CONNECTION_TIMEOUT` etc are standard.
# Custom args are usually passed when CONNECTING to the websocket (client side).

# BUT, the user wants to control the browser instance parameters.
# In the standard browserless image, `npm start` launches the websocket server.
# When we connect with `chromium.connect`, we are connecting to an existing browser or launching a new one?
# `chromium.connect(wsEndpoint)` connects to the server. The server launches the browser.
# We can pass `launchOptions` in the query string of the websocket URL!
# e.g. ws://host:3000/?--window-size=1920,1080&headless=false

# So the strategy is: 
# 1. Orchestrator receives launchOptions.
# 2. Orchestrator constructs the WS URL with these options when connecting/returning the endpoint.
# 3. The worker just runs the standard server.

# However, if we need to configure the *environment* (like XVFB resolution), we do that here.

cd /usr/src/app
exec npm start
