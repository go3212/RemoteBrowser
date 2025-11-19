import Docker from 'dockerode';
import { config } from '../config/config';
import { Session } from '../models/types';
import path from 'path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';

export class DockerService {
  private docker: Docker;
  private imageBuilt: boolean = false;

  constructor() {
    this.docker = new Docker();
    fs.ensureDirSync(config.sessionsDir);
  }

  private async ensureWorkerImage(): Promise<void> {
    if (this.imageBuilt) return;

    const imageName = config.dockerImage;
    
    // Check if image exists
    try {
      const images = await this.docker.listImages();
      const imageExists = images.some(img => 
        img.RepoTags && img.RepoTags.includes(imageName)
      );
      
      if (imageExists) {
        console.log(`Docker image ${imageName} already exists`);
        this.imageBuilt = true;
        return;
      }
    } catch (e) {
      console.log(`Checking for image failed, will build: ${e}`);
    }

    // Build image from Dockerfile
    console.log(`Building Docker image ${imageName} from worker/Dockerfile...`);
    const workerDir = path.join(__dirname, '../worker');
    
    const tarStream = require('tar-fs').pack(workerDir, {
      entries: ['Dockerfile', 'healthcheck.js', 'start-worker.sh']
    });

    const stream = await this.docker.buildImage(tarStream, {
      t: imageName,
      dockerfile: 'Dockerfile'
    });

    // Wait for build to complete
    await new Promise((resolve, reject) => {
      this.docker.modem.followProgress(stream, (err, res) => {
        if (err) {
          console.error('Docker build failed:', err);
          reject(err);
        } else {
          console.log('Docker image built successfully');
          resolve(res);
        }
      }, (event) => {
        if (event.stream) {
          process.stdout.write(event.stream);
        }
      });
    });

    this.imageBuilt = true;
  }

  public async startWorkerContainer(session: Session): Promise<{ containerName: string; port: string }> {
    // Ensure the worker image is built
    await this.ensureWorkerImage();
    
    const containerName = `browser-worker-${session.id}`;
    const mounts: Docker.MountConfig = [];

    if (session.sessionBlobId) {
      const blobPath = path.join(config.sessionsDir, session.sessionBlobId);
      const extractPath = path.join(config.sessionsDir, `extracted-${session.id}`);

      if (!fs.existsSync(extractPath)) {
        const zip = new AdmZip(blobPath);
        zip.extractAllTo(extractPath, true);
      }

      // If running in Docker, we need to mount the path from the HOST, not the container path.
      // config.hostSessionsDir should be set to the path of sessionsDir on the host.
      const mountSource = config.hostSessionsDir 
        ? path.join(config.hostSessionsDir, `extracted-${session.id}`)
        : extractPath;

      mounts.push({
        Target: '/session-profile',
        Source: mountSource,
        Type: 'bind',
        ReadOnly: false,
      });
    } else if (session.userProfile) {
        // Persistent Profile Mount
        const profilePath = path.join(config.sessionsDir, 'profiles', session.userProfile.name);
        fs.ensureDirSync(profilePath);

        const mountSource = config.hostSessionsDir 
            ? path.join(config.hostSessionsDir, 'profiles', session.userProfile.name)
            : profilePath;
            
         mounts.push({
            Target: '/session-profile',
            Source: mountSource,
            Type: 'bind',
            ReadOnly: false,
          });
    }

    const orchestratorUrl = `http://${config.orchestratorHost}:${config.port}`;

    const env = [
      `ORCHESTRATOR_URL=${orchestratorUrl}`,
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
