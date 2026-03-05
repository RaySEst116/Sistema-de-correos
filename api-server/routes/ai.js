import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';

const router = Router();

// POST /ai/draft - Generar borrador de correo con IA
router.post('/draft', AIController.generateDraft);

// GET /ai/status - Obtener estado del servicio IA
router.get('/status', AIController.getStatus);

export default router;
