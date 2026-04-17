import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Employee } from '../models';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firebaseUid, email, displayName, role, organizationId, firstName, lastName, designation, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Create user
    const user = await User.create({
      firebaseUid,
      email,
      displayName: displayName || email.split('@')[0],
      role: role || 'employee',
      organizationId,
      isActive: true,
    });

    // Create employee profile if details provided
    let employee = null;
    if (firstName && lastName) {
      const empCode = `EMP${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      employee = await Employee.create({
        userId: user.id,
        employeeCode: empCode,
        firstName,
        lastName,
        email,
        dateOfJoining: new Date(),
        designation: designation || 'Employee',
        department: department || 'General',
        currentWorkload: 0,
        maxCapacity: 40,
        velocity: 10,
        availability: 'available',
        isActive: true,
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        employee,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firebaseUid, email, password } = req.body;

    // Simple auth: Find user by email (password validation skipped for demo)
    let user = await User.findOne({
      where: email ? { email } : { firebaseUid },
      include: [{ model: Employee, as: 'employee' }],
    });

    // If user doesn't exist, create one (auto-registration)
    if (!user && email) {
      user = await User.create({
        firebaseUid: firebaseUid || `uid-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role: 'employee',
        isActive: true,
      });

      // Try to find or create employee profile
      const employee = await Employee.findOne({ where: { email } });
      if (employee && !employee.userId) {
        employee.userId = user.id;
        await employee.save();
      }
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'User account is inactive' });
      return;
    }

    // Generate a simple token
    const token = Buffer.from(`${user.id}:${email}:${Date.now()}`).toString('base64');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organizationId: user.organizationId,
        employee: user.employee,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findOne({
      where: { firebaseUid: req.user.uid },
      include: [
        {
          model: Employee,
          as: 'employee',
          include: ['skills', 'leaveBalance', 'finance'],
        },
      ],
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { displayName, photoURL } = req.body;

    const user = await User.findOne({ where: { firebaseUid: req.user.uid } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await user.update({ displayName, photoURL });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
