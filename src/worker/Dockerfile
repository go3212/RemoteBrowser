FROM browserless/chrome:latest

# We need root to copy and chmod
USER root

COPY healthcheck.js /healthcheck.js
COPY start-worker.sh /start-worker.sh

RUN chmod +x /start-worker.sh

# Switch back to non-root user 'blessuser' (standard for browserless)
USER blessuser

CMD ["/start-worker.sh"]
