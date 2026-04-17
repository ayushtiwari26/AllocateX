import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Employee, Project, Team, TeamMember, EmployeeSkill } from '../models';
import { Op } from 'sequelize';

export const generateAllocationPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.body;

    // Get available employees (not fully allocated)
    const availableEmployees = await Employee.findAll({
      where: {
        isActive: true,
        availability: { [Op.in]: ['available', 'partially-available'] },
        currentWorkload: { [Op.lt]: 40 },
      },
      include: [{ model: EmployeeSkill, as: 'skills' }],
    });

    // Get project requirements
    const project = await Project.findByPk(projectId, {
      include: [{ model: Team, as: 'teams' }],
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // AI allocation placeholder - integrate with your AI service
    const allocationPlan = {
      projectId: project.id,
      projectName: project.name,
      availableResources: availableEmployees.length,
      suggestions: availableEmployees.slice(0, 5).map((emp) => ({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        currentWorkload: emp.currentWorkload,
        availableCapacity: emp.maxCapacity - emp.currentWorkload,
        skills: emp.skills.map((s: any) => s.skillName),
        suggestedRole: 'developer',
        reasoning: 'Available capacity and matching skills',
      })),
      summary: `Found ${availableEmployees.length} available resources`,
    };

    res.json({ allocationPlan });
  } catch (error) {
    console.error('Generate allocation error:', error);
    res.status(500).json({ error: 'Failed to generate allocation plan' });
  }
};

export const getAvailableEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skills, minCapacity } = req.query;

    const where: any = {
      isActive: true,
      availability: { [Op.in]: ['available', 'partially-available'] },
    };

    if (minCapacity) {
      where.currentWorkload = { [Op.lte]: 40 - parseInt(minCapacity as string) };
    }

    const employees = await Employee.findAll({
      where,
      include: [
        { model: EmployeeSkill, as: 'skills' },
        { model: TeamMember, as: 'teamMemberships', include: [{ model: Team, as: 'team' }] },
      ],
    });

    // Filter by skills if provided
    let filtered = employees;
    if (skills) {
      const skillList = (skills as string).split(',');
      filtered = employees.filter((emp) =>
        emp.skills.some((s: any) => skillList.includes(s.skillName))
      );
    }

    res.json({
      employees: filtered.map((emp) => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation,
        currentWorkload: emp.currentWorkload,
        maxCapacity: emp.maxCapacity,
        availability: emp.availability,
        skills: emp.skills.map((s: any) => s.skillName),
        currentProjects: emp.teamMemberships.map((tm: any) => tm.team?.name).filter(Boolean),
      })),
      total: filtered.length,
    });
  } catch (error) {
    console.error('Get available employees error:', error);
    res.status(500).json({ error: 'Failed to fetch available employees' });
  }
};

export const getAllocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, projectId } = req.query;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (projectId) where['$team.projectId$'] = projectId;

    const allocations = await TeamMember.findAll({
      where,
      include: [
        { 
          model: Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName', 'designation', 'currentWorkload'] 
        },
        { 
          model: Team, 
          as: 'team', 
          include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'status'] }] 
        },
      ],
    });

    res.json({ allocations, total: allocations.length });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
};

export const applyAllocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, employeeId, role, allocationPercentage } = req.body;

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Check if team exists
    const team = await Team.findByPk(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Check capacity
    const newWorkload = employee.currentWorkload + (allocationPercentage || 100);
    if (newWorkload > employee.maxCapacity) {
      res.status(400).json({ 
        error: 'Employee capacity exceeded',
        current: employee.currentWorkload,
        requested: allocationPercentage || 100,
        max: employee.maxCapacity,
      });
      return;
    }

    // Create allocation
    const member = await TeamMember.create({
      teamId,
      employeeId,
      role: role || 'developer',
      allocationPercentage: allocationPercentage || 100,
    });

    // Update employee workload
    await employee.update({
      currentWorkload: newWorkload,
      availability:
        newWorkload >= employee.maxCapacity
          ? 'unavailable'
          : newWorkload >= employee.maxCapacity * 0.8
          ? 'partially-available'
          : 'available',
    });

    res.status(201).json({
      message: 'Allocation applied successfully',
      member,
      updatedWorkload: newWorkload,
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Employee already allocated to this team' });
      return;
    }
    console.error('Apply allocation error:', error);
    res.status(500).json({ error: 'Failed to apply allocation' });
  }
};
