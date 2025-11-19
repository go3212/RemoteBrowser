import { v4 as uuidv4 } from 'uuid';
import { Session, CreateSessionRequest } from '../models/types';
import { DockerService } from './DockerService';
import { BrowserService } from './BrowserService';
import { config } from '../config/config';
import path from 'path';
import fs from 'fs-extra';

export class OrchestratorService {
  private sessions: Map<string, Session> = new Map();
  private dockerService: DockerService;
  private browserService: BrowserService;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.dockerService = new DockerService();
    this.browserService = new BrowserService();
    this.cleanupInterval = setInterval(() => this.cleanupSessions(), 60 * 1000);
  }

  public getOrchestratorId(): string {
    return config.orchestratorId;
  }

  public getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  public async createSession(request?: CreateSessionRequest | string): Promise<Session> {
    // Support string for internal call (blobId) or object for external call
    let sessionBlobId: string | undefined;
    let launchOptions: any;
    let activeTimeout: number | undefined;

    if (typeof request === 'string') {
        sessionBlobId = request;
    } else if (request) {
        launchOptions = request.launchOptions;
        activeTimeout = request.activeTimeout;
    }

    const id = uuidv4();
    const session: Session = {
      id,
      status: 'idle',
      lastUsedAt: new Date(),
      sessionBlobId,
      launchOptions,
      activeTimeout
    };
    this.sessions.set(id, session);
    return session;
  }

  public async importSession(filePath: string): Promise<string> {
      const blobId = uuidv4() + '.zip';
      await fs.move(filePath, path.join(config.sessionsDir, blobId));
      return blobId;
  }

  public async startSession(sessionId: string): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.lastUsedAt = new Date();

    // If already active, just return (maybe reconnect if needed?)
    if (session.status === 'active' && session.workerContainerName) {
         // Check health
         const isRunning = await this.dockerService.checkContainerHealth(session.workerContainerName);
         if (isRunning && session.wsEndpoint) {
             // Ensure browser service is connected
             await this.browserService.connectToSession(sessionId, session.wsEndpoint).catch(() => {});
             return session;
         }
         // If not running, we will restart below
    }

    // Start worker
    const { containerName, port } = await this.dockerService.startWorkerContainer(session);
    session.workerContainerName = containerName;
    
    // Wait for browser
    if (!await this.waitForBrowser(port)) {
        throw new Error('Browser failed to start');
    }

    // Construct WS Endpoint with Launch Args
    let wsEndpoint = `ws://localhost:${port}/playwright`;
    if (session.launchOptions) {
        const params = new URLSearchParams();
        if (session.launchOptions.headless !== undefined) {
            params.append('headless', String(session.launchOptions.headless));
        }
        if (session.launchOptions.args) {
            session.launchOptions.args.forEach(arg => {
                if (arg.startsWith('--')) {
                   const parts = arg.substring(2).split('=');
                   params.append(parts[0], parts[1] || '');
                }
            });
        }
        if (params.toString()) {
            wsEndpoint += `?${params.toString()}`;
        }
    }

    session.wsEndpoint = wsEndpoint;
    session.status = 'active';

    // Connect BrowserService
    await this.browserService.connectToSession(sessionId, wsEndpoint);

    return session;
  }

  public async stopSession(sessionId: string) {
      const session = this.sessions.get(sessionId);
      if (session) {
          // Disconnect browser
          await this.browserService.cleanupSession(sessionId);

          // Stop container
          if (session.workerContainerName) {
              await this.dockerService.stopContainer(session.workerContainerName);
          }
          
          session.status = 'idle';
          session.workerContainerName = undefined;
          session.wsEndpoint = undefined;
      }
  }
  
  public touchSession(sessionId: string) {
      const session = this.sessions.get(sessionId);
      if (session) {
          session.lastUsedAt = new Date();
      }
  }

  // Proxy browser actions
  public getBrowserService(): BrowserService {
      return this.browserService;
  }

  private async waitForBrowser(port: string, retries = 20): Promise<boolean> {
      for (let i = 0; i < retries; i++) {
          try {
              const res = await fetch(`http://localhost:${port}/json/version`);
              if (res.ok) return true;
          } catch (e) {
              // ignore
          }
          await new Promise(r => setTimeout(r, 500));
      }
      return false;
  }

  private async cleanupSessions() {
    const now = new Date();
    for (const [id, session] of this.sessions) {
        if (session.status === 'active') {
            const timeout = session.activeTimeout || config.sessionTimeout;
            if (now.getTime() - session.lastUsedAt.getTime() > timeout) {
                console.log(`Session ${id} timed out. Stopping worker.`);
                await this.stopSession(id);
            }
        }
    }
  }
}
