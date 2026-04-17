import { Router } from 'express';
import {
  clockIn,
  clockOut,
  getAttendance,
  getAttendanceByEmployee,
  getAttendanceSummary,
  updateAttendance,
} from '../controllers/attendanceController';
import { verifyFirebaseToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyFirebaseToken);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/', requireRole('admin', 'manager'), getAttendance);
router.get('/employee/:employeeId', getAttendanceByEmployee);
router.get('/employee/:employeeId/summary', getAttendanceSummary);
router.put('/:id', requireRole('admin', 'manager'), updateAttendance);

export default router;
