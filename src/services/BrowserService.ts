import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import { config } from '../config/config';

export class BrowserService {
  private browsers: Map<string, Browser> = new Map();
  private contexts: Map<string, BrowserContext> = new Map();
  private pages: Map<string, Page> = new Map();
  private sessionContexts: Map<string, string[]> = new Map(); // sessionId -> contextIds
  private pageToSession: Map<string, string> = new Map(); // pageId -> sessionId

  public async connectToSession(sessionId: string, wsEndpoint: string): Promise<void> {
    if (this.browsers.has(sessionId)) return;

    console.log(`Connecting to browser for session ${sessionId} at ${wsEndpoint}`);
    const browser = await chromium.connect(wsEndpoint);
    this.browsers.set(sessionId, browser);
    
    // Handle disconnect
    browser.on('disconnected', () => {
        console.log(`Browser for session ${sessionId} disconnected`);
        this.cleanupSession(sessionId);
    });
    
    // Restore known contexts
    await this.restoreContexts(sessionId);
  }
  
  private async restoreContexts(sessionId: string) {
      const browser = this.browsers.get(sessionId);
      if (!browser) return;
      
      const extractPath = path.join(config.sessionsDir, `extracted-${sessionId}`);
      const metaPath = path.join(extractPath, 'contexts.json');
      
      if (fs.existsSync(metaPath)) {
          try {
              const contextIds = await fs.readJSON(metaPath);
              for (const cid of contextIds) {
                  const statePath = path.join(extractPath, `context-${cid}.json`);
                  if (fs.existsSync(statePath)) {
                       console.log(`Restoring context ${cid} for session ${sessionId}`);
                       const context = await browser.newContext({ storageState: statePath });
                       this.contexts.set(cid, context);
                       // Add to map
                       let list = this.sessionContexts.get(sessionId) || [];
                       if (!list.includes(cid)) list.push(cid);
                       this.sessionContexts.set(sessionId, list);
                  }
              }
          } catch (e) {
              console.error(`Failed to restore contexts for session ${sessionId}`, e);
          }
      }
  }

  public async createContext(sessionId: string): Promise<string> {
      const browser = this.browsers.get(sessionId);
      if (!browser) throw new Error(`Session ${sessionId} not connected`);
      
      const contextId = uuidv4();
      const context = await browser.newContext();
      this.contexts.set(contextId, context);
      
      // Track context for session
      let list = this.sessionContexts.get(sessionId) || [];
      list.push(contextId);
      this.sessionContexts.set(sessionId, list);
      
      await this.saveSessionMetadata(sessionId);

      return contextId;
  }
  
  private async saveSessionMetadata(sessionId: string) {
       const list = this.sessionContexts.get(sessionId) || [];
       const extractPath = path.join(config.sessionsDir, `extracted-${sessionId}`);
       await fs.ensureDir(extractPath);
       await fs.writeJSON(path.join(extractPath, 'contexts.json'), list);
  }

  public async createPage(contextId: string): Promise<string> {
      const context = this.contexts.get(contextId);
      if (!context) throw new Error(`Context ${contextId} not found`);
      
      const page = await context.newPage();
      const pageId = uuidv4();
      this.pages.set(pageId, page);

      // Find session ID for this context to map page
      for (const [sid, list] of this.sessionContexts) {
          if (list.includes(contextId)) {
              this.pageToSession.set(pageId, sid);
              break;
          }
      }

      return pageId;
  }

  public getSessionIdFromPage(pageId: string): string | undefined {
      return this.pageToSession.get(pageId);
  }

  public async closeContext(contextId: string): Promise<void> {
      const context = this.contexts.get(contextId);
      if (context) {
          // Save state before closing
          await this.saveContextState(contextId);
          
          await context.close();
          this.contexts.delete(contextId);
          
          // Cleanup pages map if needed? 
          // We don't have context->pages map, but pages are in 'this.pages'.
          // Ideally we should cleanup 'this.pages' for pages in this context.
          // Since pageToSession tracks them, we can leave them or clean them if we track context->pages.
          
          // Find session
          for (const [sid, list] of this.sessionContexts) {
              if (list.includes(contextId)) {
                  const newList = list.filter(id => id !== contextId);
                  this.sessionContexts.set(sid, newList);
                  await this.saveSessionMetadata(sid);
                  
                  // Remove state file
                  const extractPath = path.join(config.sessionsDir, `extracted-${sid}`);
                  const statePath = path.join(extractPath, `context-${contextId}.json`);
                  if (fs.existsSync(statePath)) await fs.remove(statePath);
                  break;
              }
          }
      }
  }
  
  private async saveContextState(contextId: string) {
      const context = this.contexts.get(contextId);
      if (!context) return;
      
      // Find session for this context to know path
      let sessionId: string | undefined;
      for (const [sid, list] of this.sessionContexts) {
          if (list.includes(contextId)) {
              sessionId = sid;
              break;
          }
      }
      
      if (sessionId) {
           const extractPath = path.join(config.sessionsDir, `extracted-${sessionId}`);
           await fs.ensureDir(extractPath);
           const statePath = path.join(extractPath, `context-${contextId}.json`);
           await context.storageState({ path: statePath });
      }
  }
  
  public async closePage(pageId: string): Promise<void> {
      const page = this.pages.get(pageId);
      if (page) {
          await page.close();
          this.pages.delete(pageId);
          this.pageToSession.delete(pageId);
      }
  }

  public getPage(pageId: string): Page | undefined {
    return this.pages.get(pageId);
  }
  
  public getSessionContexts(sessionId: string): string[] {
      return this.sessionContexts.get(sessionId) || [];
  }

  public async cleanupSession(sessionId: string) {
      // Save state for all contexts
      const contextIds = this.sessionContexts.get(sessionId) || [];
      for (const cid of contextIds) {
          await this.saveContextState(cid);
      }
      
      const browser = this.browsers.get(sessionId);
      if (browser) {
          try {
            await browser.close();
          } catch (e) {
              // ignore
          }
          this.browsers.delete(sessionId);
      }
      // Remove from memory maps
      for (const cid of contextIds) {
           this.contexts.delete(cid);
      }
      
      // Cleanup page mappings
      // This is inefficient without session->pages map, but for prototype it's ok or we iterate.
      for (const [pid, sid] of this.pageToSession) {
          if (sid === sessionId) {
              this.pages.delete(pid);
              this.pageToSession.delete(pid);
          }
      }

      this.sessionContexts.delete(sessionId);
  }

  public async navigate(pageId: string, url: string): Promise<void> {
    const page = this.getPage(pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);
    await page.goto(url);
  }

  public async click(pageId: string, selector: string): Promise<void> {
    const page = this.getPage(pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);
    await page.click(selector);
  }

  public async type(pageId: string, selector: string, text: string): Promise<void> {
    const page = this.getPage(pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);
    await page.type(selector, text);
  }

  public async screenshot(pageId: string): Promise<Buffer> {
    const page = this.getPage(pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);
    return await page.screenshot();
  }

  public async evaluate(pageId: string, script: string): Promise<any> {
    const page = this.getPage(pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);
    return await page.evaluate(script);
  }

  public async getContent(pageId: string): Promise<string> {
      const page = this.getPage(pageId);
      if (!page) throw new Error(`Page ${pageId} not found`);
      return await page.content();
  }

  public async querySelector(pageId: string, selector: string): Promise<boolean> {
      const page = this.getPage(pageId);
      if (!page) throw new Error(`Page ${pageId} not found`);
      const element = await page.$(selector);
      return !!element;
  }

  public async querySelectorAll(pageId: string, selector: string): Promise<number> {
      const page = this.getPage(pageId);
      if (!page) throw new Error(`Page ${pageId} not found`);
      const elements = await page.$$(selector);
      return elements.length;
  }
  
  public async getElementText(pageId: string, selector: string): Promise<string | null> {
      const page = this.getPage(pageId);
      if (!page) throw new Error(`Page ${pageId} not found`);
      return await page.textContent(selector);
  }
  
  public async getElementAttribute(pageId: string, selector: string, attribute: string): Promise<string | null> {
      const page = this.getPage(pageId);
      if (!page) throw new Error(`Page ${pageId} not found`);
      return await page.getAttribute(selector, attribute);
  }
}
