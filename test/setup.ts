import axios, { AxiosInstance } from 'axios';
import { config } from '../src/config/config';

export class TestClient {
  public client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string, authPassword?: string) {
    this.baseURL = baseURL || `http://localhost:${config.port}`;
    
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (authPassword) {
      const credentials = Buffer.from(`:${authPassword}`).toString('base64');
      headers.Authorization = `Basic ${credentials}`;
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  async healthCheck() {
    return this.client.get('/health');
  }

  async createSession(data?: any) {
    return this.client.post('/sessions', data || {});
  }

  async startSession(sessionId: string) {
    return this.client.post(`/sessions/${sessionId}/start`);
  }

  async getSession(sessionId: string) {
    return this.client.get(`/sessions/${sessionId}`);
  }

  async stopSession(sessionId: string) {
    return this.client.delete(`/sessions/${sessionId}`);
  }

  async createContext(sessionId: string, storageState?: any) {
    return this.client.post(`/sessions/${sessionId}/contexts`, { storageState });
  }

  async getSessionContexts(sessionId: string) {
    return this.client.get(`/sessions/${sessionId}/contexts`);
  }

  async createPage(contextId: string) {
    return this.client.post(`/contexts/${contextId}/pages`);
  }

  async getContextState(contextId: string) {
    return this.client.get(`/contexts/${contextId}/storageState`);
  }

  async closeContext(contextId: string) {
    return this.client.delete(`/contexts/${contextId}`);
  }

  async closePage(pageId: string) {
    return this.client.delete(`/pages/${pageId}`);
  }

  async navigate(pageId: string, url: string) {
    return this.client.post(`/pages/${pageId}/navigate`, { url });
  }

  async click(pageId: string, selector: string) {
    return this.client.post(`/pages/${pageId}/click`, { selector });
  }

  async type(pageId: string, selector: string, text: string) {
    return this.client.post(`/pages/${pageId}/type`, { selector, text });
  }

  async screenshot(pageId: string) {
    return this.client.get(`/pages/${pageId}/screenshot`, {
      responseType: 'arraybuffer',
    });
  }

  async evaluate(pageId: string, script: string) {
    return this.client.post(`/pages/${pageId}/evaluate`, { script });
  }

  async getContent(pageId: string) {
    return this.client.get(`/pages/${pageId}/content`);
  }

  async querySelector(pageId: string, selector: string) {
    return this.client.post(`/pages/${pageId}/querySelector`, { selector });
  }

  async querySelectorAll(pageId: string, selector: string) {
    return this.client.post(`/pages/${pageId}/querySelectorAll`, { selector });
  }

  async getElementText(pageId: string, selector: string) {
    return this.client.post(`/pages/${pageId}/elementText`, { selector });
  }

  async getElementAttribute(pageId: string, selector: string, attribute: string) {
    return this.client.post(`/pages/${pageId}/elementAttribute`, { selector, attribute });
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 30000,
  interval: number = 1000
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await sleep(interval);
  }
  return false;
}

