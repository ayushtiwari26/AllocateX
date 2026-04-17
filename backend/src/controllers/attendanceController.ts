import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Attendance, Employee } from '../models';
import { isWithinGeofence, isValidLocation } from '../utils/geofencing';
import { calculateHoursBetween, formatDate, getMonthBounds } from '../utils/dateHelpers';
import { Op } from 'sequelize';

export const clockIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, latitude, longitude } = req.body;

    if (!isValidLocation({ latitude, longitude })) {
      res.status(400).json({ error: 'Invalid GPS coordinates' });
      return;
    }

    const location = { latitude, longitude };
    const withinGeofence = isWithinGeofence(location);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    // Check if already clocked in today
    const existing = await Attendance.findOne({
      where: { employeeId, date: today },
    });

    if (existing && existing.clockInTime) {
      res.status(400).json({ error: 'Already clocked in today' });
      return;
    }

    if (existing) {
      // Update existing record
      await existing.update({
        clockInTime: new Date(),
        clockInLocation: location,
        status: withinGeofence ? 'present' : 'wfh',
      });

      res.json({
        message: 'Clocked in successfully',
        attendance: existing,
        withinGeofence,
      });
      return;
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      employeeId,
      date: new Date(today),
      clockInTime: new Date(),
      clockInLocation: location,
      status: withinGeofence ? 'present' : 'wfh',
    });

    res.json({
      message: 'Clocked in successfully',
      attendance,
      withinGeofence,
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
};

export const clockOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, latitude, longitude } = req.body;

    if (!isValidLocation({ latitude, longitude })) {
      res.status(400).json({ error: 'Invalid GPS coordinates' });
      return;
    }

    const location = { latitude, longitude };
    const today = formatDate(new Date());

    const attendance = await Attendance.findOne({
      where: { employeeId, date: today },
    });

    if (!attendance) {
      res.status(404).json({ error: 'No clock-in record found for today' });
      return;
    }

    if (attendance.clockOutTime) {
      res.status(400).json({ error: 'Already clocked out today' });
      return;
    }

    if (!attendance.clockInTime) {
      res.status(400).json({ error: 'Must clock in before clocking out' });
      return;
    }

    const clockOutTime = new Date();
    const totalHours = calculateHoursBetween(attendance.clockInTime, clockOutTime);

    await attendance.update({
      clockOutTime,
      clockOutLocation: location,
      totalHours,
      status: totalHours < 4 ? 'half-day' : attendance.status,
    });

    res.json({
      message: 'Clocked out successfully',
      attendance,
      totalHours,
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, employeeId } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department'],
        },
      ],
      order: [['date', 'DESC']],
    });

    res.json({ attendance, total: attendance.length });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const getAttendanceByEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    let where: any = { employeeId };

    if (month && year) {
      const date = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const { start, end } = getMonthBounds(date);
      where.date = { [Op.between]: [formatDate(start), formatDate(end)] };
    }

    const attendance = await Attendance.findAll({
      where,
      order: [['date', 'DESC']],
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance by employee error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const date = new Date(
      parseInt(year as string) || new Date().getFullYear(),
      parseInt(month as string) - 1 || new Date().getMonth(),
      1
    );
    const { start, end } = getMonthBounds(date);

    const attendance = await Attendance.findAll({
      where: {
        employeeId,
        date: { [Op.between]: [formatDate(start), formatDate(end)] },
      },
    });

    const summary = {
      totalDays: attendance.length,
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      halfDay: attendance.filter((a) => a.status === 'half-day').length,
      leave: attendance.filter((a) => a.status === 'leave').length,
      wfh: attendance.filter((a) => a.status === 'wfh').length,
      onDuty: attendance.filter((a) => a.status === 'on-duty').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
    };

    res.json({ summary, attendance });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const attendance = await Attendance.findByPk(id);

    if (!attendance) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    await attendance.update(updates);

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};
