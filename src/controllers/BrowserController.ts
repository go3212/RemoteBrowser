import { Request, Response } from 'express';
import { OrchestratorService } from '../services/OrchestratorService';
import { NavigateRequest, ClickRequest, TypeRequest, EvaluateRequest, QuerySelectorRequest, QuerySelectorAllRequest, ElementTextRequest, ElementAttributeRequest } from '../models/types';

export class BrowserController {
  private orchestrator: OrchestratorService;

  constructor(orchestrator: OrchestratorService) {
    this.orchestrator = orchestrator;
  }

  private get browserService() {
      return this.orchestrator.getBrowserService();
  }

  private touchSession(pageId: string) {
      const sessionId = this.browserService.getSessionIdFromPage(pageId);
      if (sessionId) {
          this.orchestrator.touchSession(sessionId);
      }
  }

  // Context & Page Management
  public getSessionContexts = async (req: Request, res: Response) => {
      try {
          const contexts = this.browserService.getSessionContexts(req.params.id);
          res.json({ contexts });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  }

  public createContext = async (req: Request, res: Response) => {
      try {
          const contextId = await this.browserService.createContext(req.params.id); // params.id is sessionId
          this.orchestrator.touchSession(req.params.id);
          res.json({ contextId });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  }

  public createPage = async (req: Request, res: Response) => {
      try {
          const pageId = await this.browserService.createPage(req.params.contextId);
          // Note: We don't have sessionId directly here easily unless we assume context->session lookup is fast, 
          // but creating a page implies activity. 
          // BrowserService creates the mapping page->session inside createPage.
          // We can check it after:
          this.touchSession(pageId);
          res.json({ pageId });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  }

  public closeContext = async (req: Request, res: Response) => {
      try {
          // We need to know session to touch? Or just ignore close activity?
          await this.browserService.closeContext(req.params.contextId);
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  }

  public closePage = async (req: Request, res: Response) => {
      try {
          this.touchSession(req.params.pageId); // Touch before closing to keep session alive if active?
          await this.browserService.closePage(req.params.pageId);
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  }


  // Page Actions (Now targetting pageId)
  public navigate = async (req: Request, res: Response) => {
    try {
      const { url } = req.body as NavigateRequest;
      await this.browserService.navigate(req.params.pageId, url);
      this.touchSession(req.params.pageId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  };

  public click = async (req: Request, res: Response) => {
    try {
      const { selector } = req.body as ClickRequest;
      await this.browserService.click(req.params.pageId, selector);
      this.touchSession(req.params.pageId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  };

  public type = async (req: Request, res: Response) => {
    try {
      const { selector, text } = req.body as TypeRequest;
      await this.browserService.type(req.params.pageId, selector, text);
      this.touchSession(req.params.pageId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  };

  public screenshot = async (req: Request, res: Response) => {
    try {
      const buffer = await this.browserService.screenshot(req.params.pageId);
      this.touchSession(req.params.pageId);
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  };

  public evaluate = async (req: Request, res: Response) => {
    try {
      const { script } = req.body as EvaluateRequest;
      const result = await this.browserService.evaluate(req.params.pageId, script);
      this.touchSession(req.params.pageId);
      res.json({ success: true, result });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  };

  public getContent = async (req: Request, res: Response) => {
      try {
          const content = await this.browserService.getContent(req.params.pageId);
          this.touchSession(req.params.pageId);
          res.send(content);
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  }

  public querySelector = async (req: Request, res: Response) => {
      try {
          const { selector } = req.body as QuerySelectorRequest;
          const exists = await this.browserService.querySelector(req.params.pageId, selector);
          this.touchSession(req.params.pageId);
          res.json({ success: true, result: exists });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  }

  public querySelectorAll = async (req: Request, res: Response) => {
      try {
          const { selector } = req.body as QuerySelectorAllRequest;
          const count = await this.browserService.querySelectorAll(req.params.pageId, selector);
          this.touchSession(req.params.pageId);
          res.json({ success: true, result: count });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  }

  public getElementText = async (req: Request, res: Response) => {
      try {
          const { selector } = req.body as ElementTextRequest;
          const text = await this.browserService.getElementText(req.params.pageId, selector);
          this.touchSession(req.params.pageId);
          res.json({ success: true, result: text });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  }

  public getElementAttribute = async (req: Request, res: Response) => {
      try {
          const { selector, attribute } = req.body as ElementAttributeRequest;
          const value = await this.browserService.getElementAttribute(req.params.pageId, selector, attribute);
          this.touchSession(req.params.pageId);
          res.json({ success: true, result: value });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  }
}
