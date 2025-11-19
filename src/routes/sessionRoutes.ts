import express from 'express';
import multer from 'multer';
import { SessionController } from '../controllers/SessionController';

const upload = multer({ dest: 'uploads/' });

export const createSessionRoutes = (sessionController: SessionController) => {
  const router = express.Router();

  router.get('/health', sessionController.healthCheck);
  router.post('/sessions', sessionController.createSession);
  router.post('/sessions/import', upload.single('file'), sessionController.importSession);
  
  // Profiles
  router.post('/profiles/import', upload.single('file'), sessionController.importUserProfile);
  router.get('/profiles/:name/export', sessionController.exportUserProfile);

  router.post('/sessions/:id/start', sessionController.startSession);
  router.delete('/sessions/:id', sessionController.stopSession);
  router.get('/sessions/:id', sessionController.getSession);

  return router;
};

