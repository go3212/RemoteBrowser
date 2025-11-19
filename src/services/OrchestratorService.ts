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
    
    const userProfile = (request as CreateSessionRequest)?.userProfile;

    const id = uuidv4();
    const session: Session = {
      id,
      status: 'idle',
      lastUsedAt: new Date(),
      sessionBlobId,
      launchOptions,
      activeTimeout,
      userProfile
    };
    this.sessions.set(id, session);
    return session;
  }

  public async importSession(filePath: string): Promise<string> {
      const blobId = uuidv4() + '.zip';
      await fs.move(filePath, path.join(config.sessionsDir, blobId));
      return blobId;
  }

  public async importUserProfile(name: string, filePath: string): Promise<void> {
      const profilePath = path.join(config.sessionsDir, 'profiles', name);
      await fs.ensureDir(profilePath);
      
      // Extract zip to profile path
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(filePath);
      zip.extractAllTo(profilePath, true);
      
      // Cleanup uploaded file
      await fs.remove(filePath);
  }

  public async exportUserProfile(name: string): Promise<string | null> {
      const profilePath = path.join(config.sessionsDir, 'profiles', name);
      if (!fs.existsSync(profilePath)) return null;
      
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      zip.addLocalFolder(profilePath);
      
      const zipPath = path.join(config.sessionsDir, 'temp', `${name}-${uuidv4()}.zip`);
      await fs.ensureDir(path.dirname(zipPath));
      zip.writeZip(zipPath);
      
      return zipPath;
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
             console.log(`Session ${sessionId} is already active, reconnecting...`);
             // Ensure browser service is connected
             await this.browserService.connectToSession(sessionId, session.wsEndpoint).catch(() => {});
             return session;
         }
         // If not running, we will restart below
         console.log(`Session ${sessionId} container is not running, restarting...`);
    }

    // Start worker
    const { containerName, port } = await this.dockerService.startWorkerContainer(session);
    session.workerContainerName = containerName;
    
    // Determine the host to connect to
    // If running in Docker (detected by /.dockerenv file), use container name
    // Otherwise use localhost (for local development)
    const isInDocker = require('fs').existsSync('/.dockerenv');
    const browserHost = isInDocker ? containerName : 'localhost';
    const browserPort = isInDocker ? '3000' : port; // Use internal port if in Docker
    
    // Construct WS Endpoint with Launch Args
    let wsEndpoint = `ws://${browserHost}:${browserPort}/playwright`;
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

    // Don't wait for browser or connect yet - do it lazily on first operation
    // This makes session creation instant
    console.log(`Session ${sessionId} created, worker at ${browserHost}:${browserPort}`);

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
          
          // Cleanup profile if it was NOT a named user profile (ephemeral)
          // OR if we want to support explicit cleanup.
          // Current requirement: "When a Session is ended. Its data is removed..."
          // But user also said "I want to be able to restore...".
          // Interpretation: Ephemeral sessions (no profile) should be clean.
          // Named profiles should probably PERSIST for export unless explicitly deleted?
          // BUT user query says: "And also when a Session is ended. Its data is removed..."
          // This implies even for named profiles, maybe?
          // Let's assume: Named profiles persist ON DISK until manually deleted, but session reference is cleaned.
          // Wait, if "Its data is removed" refers to the session itself, that's already happening (container removed).
          // If they mean the profile data:
          // "I want to be able to restore... and also to export it... And also when a Session is ended. Its data is removed..."
          // This usually means: Run session -> Write to profile -> End Session -> Data GONE from active run, but saved in profile?
          // OR it means: The session is ephemeral, but I can export the profile BEFORE it dies?
          // OR: I want a "clean slate" every time, unless I import?
          
          // Logic:
          // If userProfile is provided, we keep it on disk (so it can be exported or reused).
          // If no userProfile, DockerService mounts nothing (or temp), and it's gone when container dies.
          
          // User clarification: "I do not want to keep de data in the applicatiom... I want to be able to restore the profile from a zip... also to export it. And also when a Session is ended. Its data is removed..."
          
          // This implies:
          // 1. Import Zip -> Creates Profile
          // 2. Run Session (uses Profile)
          // 3. Export Zip -> Download Profile
          // 4. End Session -> DELETE Profile from Server (Security/Cleanup).
          
          if (session.userProfile && session.userProfile.name) {
              const profilePath = path.join(config.sessionsDir, 'profiles', session.userProfile.name);
              // We should delete the profile after the session ends to ensure "data is removed" from the application
              // But we must ensure export happens BEFORE this or allows a grace period?
              // If we delete immediately, they can't export AFTER stop.
              // They must export WHILE running or we keep it for a short time?
              // "And also when a Session is ended. Its data is removed" -> Strict cleanup.
              
              // We will delete the profile directory.
              await fs.remove(profilePath).catch(console.error);
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

  // Ensure browser is ready and connected for a session
  public async ensureBrowserReady(sessionId: string): Promise<void> {
      const session = this.sessions.get(sessionId);
      if (!session || !session.wsEndpoint) {
          throw new Error('Session not found or not started');
      }

      // If already connected, just return
      if (this.browserService.isConnected(sessionId)) {
          return;
      }

      // Extract host and port from wsEndpoint
      const match = session.wsEndpoint.match(/ws:\/\/([^:]+):(\d+)/);
      if (!match) throw new Error('Invalid wsEndpoint');
      
      const browserHost = match[1];
      const browserPort = match[2];

      // Wait for browser to be ready
      console.log(`Waiting for browser at ${browserHost}:${browserPort}...`);
      if (!await this.waitForBrowser(browserHost, browserPort, 30)) {
          throw new Error('Browser failed to start');
      }

      // Connect BrowserService
      console.log(`Connecting to browser for session ${sessionId}...`);
      await this.browserService.connectToSession(sessionId, session.wsEndpoint);
  }

  // Proxy browser actions
  public getBrowserService(): BrowserService {
      return this.browserService;
  }

  private async waitForBrowser(host: string, port: string, retries = 30): Promise<boolean> {
      console.log(`Waiting for browser at http://${host}:${port}/json/version...`);
      for (let i = 0; i < retries; i++) {
          try {
              const res = await fetch(`http://${host}:${port}/json/version`);
              if (res.ok) {
                  console.log(`Browser ready after ${i + 1} attempts`);
                  return true;
              }
          } catch (e: any) {
              if (i % 5 === 0) {
                  console.log(`Attempt ${i + 1}/${retries}: Browser not ready yet (${e.message})`);
              }
          }
          await new Promise(r => setTimeout(r, 1000)); // Increased to 1 second
      }
      console.error(`Browser failed to start after ${retries} attempts`);
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
