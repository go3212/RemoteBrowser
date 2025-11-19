import { Request, Response } from 'express';
import { OrchestratorService } from '../services/OrchestratorService';
import { CreateSessionRequest } from '../models/types';

export class SessionController {
  private orchestrator: OrchestratorService;

  constructor(orchestrator: OrchestratorService) {
    this.orchestrator = orchestrator;
  }

  public createSession = async (req: Request, res: Response) => {
    try {
      const requestBody = req.body as CreateSessionRequest;
      const session = await this.orchestrator.createSession(requestBody);
      res.json(session);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  };

  public importSession = async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).send('No file uploaded');
      return;
    }
    try {
      const blobId = await this.orchestrator.importSession(req.file.path);
      const session = await this.orchestrator.createSession(blobId);
      res.json(session);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  };

  public startSession = async (req: Request, res: Response) => {
    try {
      const session = await this.orchestrator.startSession(req.params.id);
      res.json(session);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  };

  public stopSession = async (req: Request, res: Response) => {
    try {
      await this.orchestrator.stopSession(req.params.id);
      res.sendStatus(200);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  };

  public getSession = (req: Request, res: Response) => {
    const session = this.orchestrator.getSession(req.params.id);
    if (session) res.json(session);
    else res.status(404).send('Not found');
  };

  public healthCheck = (req: Request, res: Response) => {
    res.json({ orchestratorId: this.orchestrator.getOrchestratorId() });
  };
}
