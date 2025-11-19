import express from 'express';
import { OrchestratorService } from '../services/OrchestratorService';
import { SessionController } from '../controllers/SessionController';
import { BrowserController } from '../controllers/BrowserController';
import { createSessionRoutes } from './sessionRoutes';
import { createBrowserRoutes } from './browserRoutes';

export const createRoutes = (orchestrator: OrchestratorService) => {
  const router = express.Router();
  
  const sessionController = new SessionController(orchestrator);
  const browserController = new BrowserController(orchestrator);

  router.use('/', createSessionRoutes(sessionController));
  router.use('/', createBrowserRoutes(browserController));

  return router;
};

