import { Router } from 'express';
import {
  getEmployeeFinance,
  updateEmployeeFinance,
  getBankDetails,
  addBankDetails,
  updateBankDetails,
  deleteBankDetails,
  verifyBankDetails,
} from '../controllers/financeController';
import { verifyFirebaseToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyFirebaseToken);

router.get('/:employeeId', getEmployeeFinance);
router.put('/:employeeId', requireRole('admin', 'manager'), updateEmployeeFinance);

router.get('/:employeeId/bank', getBankDetails);
router.post('/:employeeId/bank', addBankDetails);
router.put('/:employeeId/bank/:bankId', updateBankDetails);
router.delete('/:employeeId/bank/:bankId', deleteBankDetails);
router.post('/:employeeId/bank/:bankId/verify', requireRole('admin', 'manager'), verifyBankDetails);

export default router;
