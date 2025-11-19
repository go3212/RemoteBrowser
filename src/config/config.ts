import path from 'path';

export const config = {
  port: process.env.PORT || 3000,
  orchestratorId: process.env.ORCHESTRATOR_ID || `orch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  sessionsDir: path.join(process.cwd(), 'sessions'),
  sessionTimeout: 1000 * 60 * 30, // 30 minutes inactive timeout
  dockerImage: 'remote-browser-worker', // We will build this
  networkName: 'remote-browser-net', // Shared network
  authPassword: process.env.AUTH_PASSWORD || null,
  // For Docker-in-Docker or similar setups where the host path differs from container path
  hostSessionsDir: process.env.HOST_SESSIONS_DIR || null,
  orchestratorHost: process.env.ORCHESTRATOR_HOST || 'host.docker.internal',
};
