import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/config';
import { OrchestratorService } from './services/OrchestratorService';
import { createRoutes } from './routes';

const app = express();
const orchestrator = new OrchestratorService();

app.use(cors());
app.use(express.json());

// Auth Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!config.authPassword) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const [type, credentials] = authHeader.split(' ');
  
  if (type !== 'Basic' || !credentials) {
    res.status(401).json({ error: 'Invalid authentication format' });
    return;
  }

  try {
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [_, password] = decoded.split(':'); // username:password

    if (password === config.authPassword) {
      next();
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (e) {
    res.status(401).json({ error: 'Invalid authentication credentials' });
  }
});

app.use('/', createRoutes(orchestrator));

app.listen(config.port, () => {
  console.log(`Orchestrator listening on port ${config.port}`);
  console.log(`Orchestrator ID: ${config.orchestratorId}`);
  if (config.authPassword) {
    console.log('Authentication enabled');
  }
});
