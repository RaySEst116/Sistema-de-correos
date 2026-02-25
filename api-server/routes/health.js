import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

const router = Router();

// GET /ping - Ping básico
router.get('/ping', HealthController.ping);

// GET /health - Health check completo
router.get('/health', HealthController.healthCheck);

export default router;
