import { Router } from 'express';
import { HealthController } from '../controllers/HealthController.js';

const router = Router();

// GET /api/v1/health -> { "status": "ok" }
router.get('/', HealthController.getHealth);
router.get('/detailed', HealthController.getDetailedHealth);

export default router;
