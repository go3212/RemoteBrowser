export type SessionStatus = 'active' | 'idle' | 'closed';

export interface BrowserLaunchOptions {
  headless?: boolean;
  args?: string[];
  viewport?: { width: number; height: number } | null;
  ignoreDefaultArgs?: boolean | string[];
  executablePath?: string; 
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
}

export interface Session {
  id: string;
  status: SessionStatus;
  lastUsedAt: Date;
  workerContainerName?: string;
  sessionBlobId?: string;
  wsEndpoint?: string; 
  launchOptions?: BrowserLaunchOptions;
  activeTimeout?: number; // Timeout in milliseconds
}

export interface CreateSessionRequest {
  launchOptions?: BrowserLaunchOptions;
  activeTimeout?: number; // Timeout in milliseconds
}

export interface CreateSessionResponse {
  sessionId: string;
  status: SessionStatus;
  wsEndpoint?: string;
}

export interface CreateContextResponse {
  contextId: string;
}

export interface CreatePageResponse {
  pageId: string;
}

export interface HealthCheckResponse {
  orchestratorId: string;
}

// API DTOs
export interface NavigateRequest {
  url: string;
}

export interface ClickRequest {
  selector: string;
}

export interface TypeRequest {
  selector: string;
  text: string;
}

export interface EvaluateRequest {
  script: string;
}

export interface QuerySelectorRequest {
  selector: string;
}

export interface QuerySelectorAllRequest {
  selector: string;
}

export interface ElementTextRequest {
  selector: string;
}

export interface ElementAttributeRequest {
  selector: string;
  attribute: string;
}

export interface BrowserActionResponse {
  success: boolean;
  result?: any;
  error?: string;
}
