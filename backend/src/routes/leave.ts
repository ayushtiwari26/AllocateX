import { Router } from 'express';
import {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  updateLeaveStatus,
  cancelLeaveRequest,
  getLeaveBalance,
  getLeaveCalendar,
} from '../controllers/leaveController';
import { verifyFirebaseToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyFirebaseToken);

router.post('/request', createLeaveRequest);
router.get('/requests', getLeaveRequests);
router.get('/requests/:id', getLeaveRequestById);
router.put('/requests/:id/status', requireRole('admin', 'manager', 'team_lead'), updateLeaveStatus);
router.put('/requests/:id/cancel', cancelLeaveRequest);
router.get('/balance/:employeeId', getLeaveBalance);
router.get('/calendar/:employeeId', getLeaveCalendar);

export default router;
