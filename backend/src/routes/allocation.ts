import { Router } from 'express';
import {
  generateAllocationPlan,
  getAvailableEmployees,
  getAllocations,
  applyAllocation,
} from '../controllers/allocationController';
import { verifyFirebaseToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyFirebaseToken);

router.post('/generate', requireRole('admin', 'manager'), generateAllocationPlan);
router.get('/available', getAvailableEmployees);
router.get('/current', getAllocations);
router.post('/apply', requireRole('admin', 'manager'), applyAllocation);

export default router;
