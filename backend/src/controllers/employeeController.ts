import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Employee, EmployeeSkill, User, LeaveBalance, EmployeeFinance, TeamMember, Team, Project } from '../models';
import { Op } from 'sequelize';
import { randomUUID } from 'crypto';

// Generate a reasonably unique employee code; fallback if none provided
const generateEmployeeCode = () => `EMP-${Math.floor(10000 + Math.random() * 90000)}`;

export const getAllEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, department, availability, isActive } = req.query;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (department) where.department = department;
    if (availability) where.availability = availability;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const employees = await Employee.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['email', 'displayName', 'role'] },
        { model: EmployeeSkill, as: 'skills' },
        { model: LeaveBalance, as: 'leaveBalance' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ employees, total: employees.length });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: EmployeeSkill, as: 'skills' },
        { model: LeaveBalance, as: 'leaveBalance' },
        { model: EmployeeFinance, as: 'finance' },
        { model: Employee, as: 'reportingManager', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: TeamMember,
          as: 'teamMemberships',
          include: [
            {
              model: Team,
              as: 'team',
              include: [
                {
                  model: Project,
                  as: 'project',
                },
              ],
            },
          ],
        },
      ],
      order: [[{ model: TeamMember, as: 'teamMemberships' }, 'joinedAt', 'DESC']],
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      userId,
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      dateOfJoining,
      joiningDate,
      designation,
      department,
      reportingManagerId,
      currentWorkload,
      maxCapacity,
      velocity,
      skills,
    } = req.body;

    if (!firstName || !lastName || !email || !designation || !department) {
      res.status(400).json({ error: 'Missing required fields (firstName, lastName, email, designation, department)' });
      return;
    }

    // Resolve a user record: reuse existing by email or create a local stub if not provided
    let resolvedUserId = userId;
    let resolvedUser = null;

    if (resolvedUserId) {
      resolvedUser = await User.findByPk(resolvedUserId);
      if (!resolvedUser) {
        res.status(400).json({ error: 'Provided userId not found' });
        return;
      }
    } else {
      resolvedUser = await User.findOne({ where: { email } });
      if (!resolvedUser) {
        resolvedUser = await User.create({
          firebaseUid: `local-${randomUUID()}`,
          email,
          displayName: `${firstName} ${lastName}`.trim(),
          role: 'employee',
          organizationId: null,
        });
      }
      resolvedUserId = resolvedUser.id;
    }

    // Normalize dates and codes
    const normalizedJoinDate = dateOfJoining || joiningDate || new Date().toISOString();

    // Ensure unique/available employee code
    let finalEmployeeCode = employeeCode || generateEmployeeCode();
    if (employeeCode) {
      const existing = await Employee.findOne({ where: { employeeCode } });
      if (existing) {
        res.status(400).json({ error: 'Employee code already exists' });
        return;
      }
    } else {
      // simple retry loop to avoid rare collision
      for (let i = 0; i < 3; i++) {
        const collision = await Employee.findOne({ where: { employeeCode: finalEmployeeCode } });
        if (!collision) break;
        finalEmployeeCode = generateEmployeeCode();
      }
    }

    // Check if employee code already exists
    const employee = await Employee.create({
      userId: resolvedUserId,
      employeeCode: finalEmployeeCode,
      firstName,
      lastName,
      email,
      phone,
      dateOfJoining: normalizedJoinDate,
      designation,
      department,
      reportingManagerId,
      currentWorkload: currentWorkload || 0,
      maxCapacity: maxCapacity || 40,
      velocity: velocity || 10,
      availability: 'available',
      isActive: true,
    });

    // Create initial leave balance for current year
    const year = new Date(normalizedJoinDate).getFullYear();
    await LeaveBalance.create({
      employeeId: employee.id,
      year,
      casualLeave: 12,
      sickLeave: 12,
      earnedLeave: 15,
      unpaidLeave: 0,
    });

    // Optionally persist skills if provided as array of strings/objects
    if (Array.isArray(skills) && skills.length) {
      const normalizedSkills = skills.map((skill: any) => {
        if (typeof skill === 'string') {
          return { skillName: skill, proficiency: 'intermediate', yearsOfExperience: 1 };
        }
        return {
          skillName: skill.skillName || skill.name,
          proficiency: skill.proficiency || 'intermediate',
          yearsOfExperience: skill.yearsOfExperience || skill.experience || 1,
        };
      }).filter((s: any) => s.skillName);

      if (normalizedSkills.length) {
        await EmployeeSkill.bulkCreate(normalizedSkills.map((s: any) => ({
          employeeId: employee.id,
          skillName: s.skillName,
          proficiency: s.proficiency,
          yearsOfExperience: s.yearsOfExperience,
        })));
      }
    }

    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    await employee.update(updates);

    res.json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Soft delete - mark as inactive
    await employee.update({ isActive: false });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

export const getEmployeeSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skills = await EmployeeSkill.findAll({
      where: { employeeId: id },
      order: [['yearsOfExperience', 'DESC']],
    });

    res.json({ skills });
  } catch (error) {
    console.error('Get employee skills error:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
};

export const addEmployeeSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { skillName, proficiency, yearsOfExperience } = req.body;

    const skill = await EmployeeSkill.create({
      employeeId: id,
      skillName,
      proficiency: proficiency || 'intermediate',
      yearsOfExperience: yearsOfExperience || 0,
    });

    res.status(201).json({ message: 'Skill added successfully', skill });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Skill already exists for this employee' });
      return;
    }
    console.error('Add employee skill error:', error);
    res.status(500).json({ error: 'Failed to add skill' });
  }
};

export const updateEmployeeSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params;
    const updates = req.body;

    const skill = await EmployeeSkill.findOne({
      where: { id: skillId, employeeId: id },
    });

    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    await skill.update(updates);

    res.json({ message: 'Skill updated successfully', skill });
  } catch (error) {
    console.error('Update employee skill error:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
};

export const deleteEmployeeSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params;

    const skill = await EmployeeSkill.findOne({
      where: { id: skillId, employeeId: id },
    });

    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    await skill.destroy();

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete employee skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
};
