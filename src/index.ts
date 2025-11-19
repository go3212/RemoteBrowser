import express from 'express';
import cors from 'cors';
import { config } from './config/config';
import { OrchestratorService } from './services/OrchestratorService';
import { createRoutes } from './routes';

const app = express();
const orchestrator = new OrchestratorService();

app.use(cors());
app.use(express.json());
app.use('/', createRoutes(orchestrator));

app.listen(config.port, () => {
  console.log(`Orchestrator listening on port ${config.port}`);
  console.log(`Orchestrator ID: ${config.orchestratorId}`);
});
