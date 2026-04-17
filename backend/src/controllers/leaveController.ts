import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LeaveRequest, LeaveBalance, Employee, Holiday } from '../models';
import { calculateDaysBetween, formatDate } from '../utils/dateHelpers';
import { Op } from 'sequelize';

export const createLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    const totalDays = calculateDaysBetween(new Date(startDate), new Date(endDate));

    // Check leave balance
    const year = new Date(startDate).getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      where: { employeeId, year },
    });

    if (!leaveBalance) {
      res.status(404).json({ error: 'Leave balance not found' });
      return;
    }

    // Validate sufficient leave balance
    const leaveTypeMap: any = {
      casual: 'casualLeave',
      sick: 'sickLeave',
      earned: 'earnedLeave',
    };

    if (leaveType in leaveTypeMap) {
      const balanceField = leaveTypeMap[leaveType] as keyof Pick<LeaveBalance, 'casualLeave' | 'sickLeave' | 'earnedLeave'>;
      if ((leaveBalance as any)[balanceField] < totalDays) {
        res.status(400).json({
          error: `Insufficient ${leaveType} leave balance`,
          available: (leaveBalance as any)[balanceField],
          requested: totalDays,
        });
        return;
      }
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'pending',
      totalDays,
    });

    res.status(201).json({
      message: 'Leave request created successfully',
      leaveRequest,
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
};

export const getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, status, startDate, endDate } = req.query;

    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where[Op.or] = [
        {
          startDate: { [Op.between]: [startDate, endDate] },
        },
        {
          endDate: { [Op.between]: [startDate, endDate] },
        },
      ];
    }

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department'],
        },
        {
          model: Employee,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ leaveRequests, total: leaveRequests.length });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

export const getLeaveRequestById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: Employee, as: 'approver' },
      ],
    });

    if (!leaveRequest) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    res.json({ leaveRequest });
  } catch (error) {
    console.error('Get leave request by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch leave request' });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, approverRemarks } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const leaveRequest = await LeaveRequest.findByPk(id);

    if (!leaveRequest) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    if (leaveRequest.status !== 'pending') {
      res.status(400).json({ error: 'Leave request already processed' });
      return;
    }

    // Find approver employee record
    const approver = await Employee.findOne({ where: { userId: req.user.userId } });

    if (!approver) {
      res.status(404).json({ error: 'Approver employee record not found' });
      return;
    }

    await leaveRequest.update({
      status,
      approverId: approver.id,
      approverRemarks,
      approvedAt: new Date(),
    });

    // Update leave balance if approved
    if (status === 'approved') {
      const year = new Date(leaveRequest.startDate).getFullYear();
      const leaveBalance = await LeaveBalance.findOne({
        where: { employeeId: leaveRequest.employeeId, year },
      });

      if (leaveBalance) {
        const leaveTypeMap: any = {
          casual: 'casualLeave',
          sick: 'sickLeave',
          earned: 'earnedLeave',
          unpaid: 'unpaidLeave',
        };

        const balanceField = leaveTypeMap[leaveRequest.leaveType];
        if (balanceField) {
          await leaveBalance.update({
            [balanceField]: Math.max(0, (leaveBalance as any)[balanceField] - leaveRequest.totalDays),
          });
        }
      }
    }

    res.json({ message: 'Leave request updated successfully', leaveRequest });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
};

export const cancelLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const leaveRequest = await LeaveRequest.findByPk(id);

    if (!leaveRequest) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    if (leaveRequest.status === 'approved') {
      // Restore leave balance
      const year = new Date(leaveRequest.startDate).getFullYear();
      const leaveBalance = await LeaveBalance.findOne({
        where: { employeeId: leaveRequest.employeeId, year },
      });

      if (leaveBalance) {
        const leaveTypeMap: any = {
          casual: 'casualLeave',
          sick: 'sickLeave',
          earned: 'earnedLeave',
          unpaid: 'unpaidLeave',
        };

        const balanceField = leaveTypeMap[leaveRequest.leaveType];
        if (balanceField) {
          await leaveBalance.update({
            [balanceField]: (leaveBalance as any)[balanceField] + leaveRequest.totalDays,
          });
        }
      }
    }

    await leaveRequest.update({ status: 'cancelled' });

    res.json({ message: 'Leave request cancelled successfully', leaveRequest });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
};

export const getLeaveBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    const leaveYear = year ? parseInt(year as string) : new Date().getFullYear();

    let leaveBalance = await LeaveBalance.findOne({
      where: { employeeId, year: leaveYear },
    });

    // Create if doesn't exist
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employeeId,
        year: leaveYear,
        casualLeave: 12,
        sickLeave: 12,
        earnedLeave: 15,
        unpaidLeave: 0,
      });
    }

    res.json({ leaveBalance });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
};

export const getLeaveCalendar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get approved leave requests
    const leaveRequests = await LeaveRequest.findAll({
      where: {
        employeeId,
        status: 'approved',
        [Op.or]: [
          { startDate: { [Op.between]: [formatDate(startDate), formatDate(endDate)] } },
          { endDate: { [Op.between]: [formatDate(startDate), formatDate(endDate)] } },
        ],
      },
    });

    // Get holidays
    const holidays = await Holiday.findAll({
      where: {
        date: { [Op.between]: [formatDate(startDate), formatDate(endDate)] },
      },
    });

    const calendar = {
      month: targetMonth,
      year: targetYear,
      leaveRequests,
      holidays,
    };

    res.json({ calendar });
  } catch (error) {
    console.error('Get leave calendar error:', error);
    res.status(500).json({ error: 'Failed to fetch leave calendar' });
  }
};
