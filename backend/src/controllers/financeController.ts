import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { EmployeeFinance, BankDetails, Employee } from '../models';

export const getEmployeeFinance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const finance = await EmployeeFinance.findOne({
      where: { employeeId },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] }],
    });

    res.json({ finance });
  } catch (error) {
    console.error('Get employee finance error:', error);
    res.status(500).json({ error: 'Failed to fetch finance details' });
  }
};

export const updateEmployeeFinance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const updates = req.body;

    let finance = await EmployeeFinance.findOne({ where: { employeeId } });

    if (!finance) {
      finance = await EmployeeFinance.create({ employeeId, ...updates });
      res.status(201).json({ message: 'Finance details created', finance });
      return;
    }

    await finance.update(updates);
    res.json({ message: 'Finance details updated', finance });
  } catch (error) {
    console.error('Update employee finance error:', error);
    res.status(500).json({ error: 'Failed to update finance details' });
  }
};

export const getBankDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const bankDetails = await BankDetails.findAll({
      where: { employeeId },
      order: [['isPrimary', 'DESC']],
    });

    res.json({ bankDetails });
  } catch (error) {
    console.error('Get bank details error:', error);
    res.status(500).json({ error: 'Failed to fetch bank details' });
  }
};

export const addBankDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { bankName, accountNumber, ifscCode, accountHolderName, branch, isPrimary } = req.body;

    const bankDetails = await BankDetails.create({
      employeeId,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      branch,
      isPrimary: isPrimary || false,
      isVerified: false,
    });

    res.status(201).json({ message: 'Bank details added', bankDetails });
  } catch (error) {
    console.error('Add bank details error:', error);
    res.status(500).json({ error: 'Failed to add bank details' });
  }
};

export const updateBankDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bankId } = req.params;
    const updates = req.body;

    const bankDetails = await BankDetails.findByPk(bankId);

    if (!bankDetails) {
      res.status(404).json({ error: 'Bank details not found' });
      return;
    }

    await bankDetails.update(updates);
    res.json({ message: 'Bank details updated', bankDetails });
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ error: 'Failed to update bank details' });
  }
};

export const deleteBankDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bankId } = req.params;

    const bankDetails = await BankDetails.findByPk(bankId);

    if (!bankDetails) {
      res.status(404).json({ error: 'Bank details not found' });
      return;
    }

    await bankDetails.destroy();
    res.json({ message: 'Bank details deleted' });
  } catch (error) {
    console.error('Delete bank details error:', error);
    res.status(500).json({ error: 'Failed to delete bank details' });
  }
};

export const verifyBankDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bankId } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const bankDetails = await BankDetails.findByPk(bankId);

    if (!bankDetails) {
      res.status(404).json({ error: 'Bank details not found' });
      return;
    }

    const verifier = await Employee.findOne({ where: { userId: req.user.userId } });

    await bankDetails.update({
      isVerified: true,
      verifiedBy: verifier?.id || null,
      verifiedAt: new Date(),
    });

    res.json({ message: 'Bank details verified', bankDetails });
  } catch (error) {
    console.error('Verify bank details error:', error);
    res.status(500).json({ error: 'Failed to verify bank details' });
  }
};
