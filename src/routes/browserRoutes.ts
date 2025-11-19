import express from 'express';
import { BrowserController } from '../controllers/BrowserController';

export const createBrowserRoutes = (browserController: BrowserController) => {
  const router = express.Router();

  // Session level
  router.get('/sessions/:id/contexts', browserController.getSessionContexts);
  router.post('/sessions/:id/contexts', browserController.createContext);

  // Context level
  router.post('/contexts/:contextId/pages', browserController.createPage);
  router.delete('/contexts/:contextId', browserController.closeContext);

  // Page level
  router.delete('/pages/:pageId', browserController.closePage);
  
  // Page Actions (Changed :id to :pageId)
  router.post('/pages/:pageId/navigate', browserController.navigate);
  router.post('/pages/:pageId/click', browserController.click);
  router.post('/pages/:pageId/type', browserController.type);
  router.get('/pages/:pageId/screenshot', browserController.screenshot);
  router.post('/pages/:pageId/evaluate', browserController.evaluate);
  router.get('/pages/:pageId/content', browserController.getContent);
  
  router.post('/pages/:pageId/querySelector', browserController.querySelector);
  router.post('/pages/:pageId/querySelectorAll', browserController.querySelectorAll);
  router.post('/pages/:pageId/elementText', browserController.getElementText);
  router.post('/pages/:pageId/elementAttribute', browserController.getElementAttribute);

  return router;
};
