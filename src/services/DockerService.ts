import Docker from 'dockerode';
import { config } from '../config/config';
import { Session } from '../models/types';
import path from 'path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
    fs.ensureDirSync(config.sessionsDir);
  }

  public async startWorkerContainer(session: Session): Promise<{ containerName: string; port: string }> {
    const containerName = `browser-worker-${session.id}`;
    const mounts: Docker.MountConfig = [];

    if (session.sessionBlobId) {
      const blobPath = path.join(config.sessionsDir, session.sessionBlobId);
      const extractPath = path.join(config.sessionsDir, `extracted-${session.id}`);

      if (!fs.existsSync(extractPath)) {
        const zip = new AdmZip(blobPath);
        zip.extractAllTo(extractPath, true);
      }

      mounts.push({
        Target: '/session-profile',
        Source: extractPath,
        Type: 'bind',
        ReadOnly: false,
      });
    }

    const env = [
      `ORCHESTRATOR_URL=http://host.docker.internal:${config.port}`,
      `ORCHESTRATOR_ID=${config.orchestratorId}`,
      `SESSION_ID=${session.id}`,
      `CONNECTION_TIMEOUT=60000`,
      `USER_DATA_DIR=/session-profile`,
    ];

    // Pass args env if needed for container config, e.g. SCREEN_WIDTH/HEIGHT
    if (session.launchOptions?.viewport) {
        // If standard browserless/chrome is used
        // env.push(`SCREEN_WIDTH=${session.launchOptions.viewport.width}`);
        // env.push(`SCREEN_HEIGHT=${session.launchOptions.viewport.height}`);
    }
    // But we handle actual launch args via WS connection string usually.
    // However, if we want to pass them as env vars to be picked up by start script:
    if (session.launchOptions?.args) {
        // Maybe join them? But WS URL is better for puppeteer/playwright args.
        // For now, we keep env minimal.
    }

    // Cleanup old container if exists
    try {
      const old = this.docker.getContainer(containerName);
      await old.remove({ force: true }).catch(() => {});
    } catch {}

    const container = await this.docker.createContainer({
      Image: config.dockerImage,
      name: containerName,
      Env: env,
      ExposedPorts: { '3000/tcp': {} },
      HostConfig: {
        PortBindings: { '3000/tcp': [{ HostPort: '0' }] },
        AutoRemove: true,
        Mounts: mounts,
        ShmSize: 2 * 1024 * 1024 * 1024,
        ExtraHosts: ['host.docker.internal:host-gateway'],
      },
    });

    await container.start();

    const inspect = await container.inspect();
    const port = inspect.NetworkSettings.Ports['3000/tcp'][0].HostPort;

    return { containerName, port };
  }

  public async stopContainer(containerName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerName);
      await container.stop();
    } catch (e) {
      console.error(`Failed to stop container ${containerName}`, e);
    }
  }

  public async checkContainerHealth(containerName: string): Promise<boolean> {
    try {
      const container = this.docker.getContainer(containerName);
      const inspect = await container.inspect();
      return inspect.State.Running;
    } catch {
      return false;
    }
  }
  
  public async getContainerPort(containerName: string): Promise<string | null> {
      try {
          const container = this.docker.getContainer(containerName);
          const inspect = await container.inspect();
           if (inspect.State.Running) {
                return inspect.NetworkSettings.Ports['3000/tcp'][0].HostPort;
           }
           return null;
      } catch {
          return null;
      }
  }
}
