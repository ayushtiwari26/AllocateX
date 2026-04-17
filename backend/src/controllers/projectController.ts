import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Project, Team, TeamMember, Employee, EmployeeSkill } from '../models';
import { Op } from 'sequelize';

type ProjectRequirement = { role: string; count: number };

const parseRequirements = (raw: any): ProjectRequirement[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ProjectRequirement[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse project requirements:', error);
    return [];
  }
};

const serializeRequirements = (requirements?: ProjectRequirement[]) => {
  if (!requirements || requirements.length === 0) return null;
  return JSON.stringify(requirements);
};

const formatProject = (project: Project) => {
  const plain = project.get({ plain: true }) as any;
  plain.requirements = parseRequirements(plain.requirements);
  if (Array.isArray(plain.teams)) {
    plain.teams = plain.teams.map((team: any) => ({
      ...team,
      members: Array.isArray(team.members)
        ? team.members.map((member: any) => ({
            ...member,
            allocationPercentage: member.allocationPercentage ?? 100,
          }))
        : [],
    }));
  }
  return plain;
};

const ROLE_SKILL_MAP: Record<string, string[]> = {
  frontend: ['React', 'Next.js', 'JavaScript', 'TypeScript', 'CSS', 'UI'],
  backend: ['Node.js', 'Python', 'API', 'PostgreSQL', 'Microservices', 'Go', 'FastAPI'],
  'full stack': ['React', 'Node.js', 'GraphQL', 'Next.js'],
  devops: ['DevOps', 'AWS', 'Terraform', 'CI/CD', 'Docker', 'Kubernetes'],
  mobile: ['Flutter', 'Android', 'iOS', 'React Native', 'Kotlin'],
  qa: ['QA', 'Automation', 'Cypress', 'Testing', 'Test Strategy'],
  designer: ['Design', 'Figma', 'Design Systems', 'Prototyping'],
  product: ['Product', 'Agile', 'Scrum', 'Roadmapping', 'Stakeholder'],
  data: ['Data', 'Analytics', 'Machine Learning', 'Python', 'SQL'],
};

const deriveRoleKeywords = (role: string): string[] => {
  const normalized = role.toLowerCase();
  const matched = Object.entries(ROLE_SKILL_MAP)
    .filter(([key]) => normalized.includes(key))
    .flatMap(([, skills]) => skills);

  if (matched.length) return matched;

  return normalized
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1));
};

export const getAllProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, managerId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (managerId) where.managerId = managerId;

    const projects = await Project.findAll({
      where,
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: Team,
          as: 'teams',
          include: [
            { model: Employee, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'designation'] },
            {
              model: TeamMember,
              as: 'members',
              include: [
                {
                  model: Employee,
                  as: 'employee',
                  include: [{ model: EmployeeSkill, as: 'skills' }],
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const formatted = projects.map(formatProject);

    res.json({ projects: formatted, total: formatted.length });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, {
      include: [
        { model: Employee, as: 'manager' },
        {
          model: Team,
          as: 'teams',
          include: [
            { model: Employee, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'designation'] },
            {
              model: TeamMember,
              as: 'members',
              include: [
                {
                  model: Employee,
                  as: 'employee',
                  include: [{ model: EmployeeSkill, as: 'skills' }],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project: formatProject(project) });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, startDate, endDate, managerId, requirements, priority } = req.body;
    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      managerId,
      requirements: serializeRequirements(requirements),
      priority: priority || 'medium',
      status: 'active',
    });

    // Ensure every project starts with at least one team so members can be allocated immediately
    await Team.create({
      projectId: project.id,
      name: req.body.defaultTeamName || 'Core Team',
      description: req.body.defaultTeamDescription || null,
    });

    await project.reload({
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
        { model: Team, as: 'teams', include: [{ model: TeamMember, as: 'members', include: [{ model: Employee, as: 'employee', include: [{ model: EmployeeSkill, as: 'skills' }] }] }] },
      ],
    });

    res.status(201).json({ message: 'Project created', project: formatProject(project) });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const updates = { ...req.body };
    if (updates.requirements) {
      updates.requirements = serializeRequirements(updates.requirements);
    }
    await project.update(updates);

    await project.reload({
      include: [
        { model: Employee, as: 'manager' },
        {
          model: Team,
          as: 'teams',
          include: [
            { model: Employee, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'designation'] },
            {
              model: TeamMember,
              as: 'members',
              include: [
                {
                  model: Employee,
                  as: 'employee',
                  include: [{ model: EmployeeSkill, as: 'skills' }],
                },
              ],
            },
          ],
        },
      ],
    });

    res.json({ message: 'Project updated', project: formatProject(project) });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Find all teams for this project
    const teams = await Team.findAll({ where: { projectId: id } });
    const teamIds = teams.map(t => t.id);

    if (teamIds.length > 0) {
      // Delete all members of these teams
      await TeamMember.destroy({ where: { teamId: teamIds } });
      // Delete all teams
      await Team.destroy({ where: { id: teamIds } });
    }

    // Delete the project
    await project.destroy();

    res.json({ message: 'Project deleted permanently' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const getProjectTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teams = await Team.findAll({
      where: { projectId: id },
      include: [
        { model: Employee, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'designation'] },
        {
          model: TeamMember,
          as: 'members',
          include: [
            {
              model: Employee,
              as: 'employee',
              include: [{ model: EmployeeSkill, as: 'skills' }],
            },
          ],
        },
      ],
    });
    res.json({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

export const addTeamToProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, leadId } = req.body;
    const team = await Team.create({ projectId: id, name, description, leadId });
    await team.reload({
      include: [
        { model: Employee, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'designation'] },
        {
          model: TeamMember,
          as: 'members',
          include: [
            {
              model: Employee,
              as: 'employee',
              include: [{ model: EmployeeSkill, as: 'skills' }],
            },
          ],
        },
      ],
    });
    res.status(201).json({ message: 'Team created', team });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const team = await Team.findByPk(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    await team.update(req.body);
    res.json({ message: 'Team updated', team });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const team = await Team.findByPk(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    await team.destroy();
    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { employeeId, role, allocationPercentage } = req.body;
    
    const existingMember = await TeamMember.findOne({ where: { teamId, employeeId } });
    if (existingMember) {
      res.status(400).json({ error: 'Member already in team' });
      return;
    }

    const member = await TeamMember.create({
      teamId,
      employeeId,
      role: role || 'developer',
      allocationPercentage: allocationPercentage || 100,
    });

    await member.reload({
      include: [
        {
          model: Employee,
          as: 'employee',
          include: [{ model: EmployeeSkill, as: 'skills' }],
        },
        { model: Team, as: 'team', include: [{ model: Project, as: 'project' }] },
      ],
    });

    res.status(201).json({ message: 'Member added', member });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Member already in team' });
      return;
    }
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

export const updateTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, memberId, id: projectId } = req.params as { teamId: string; memberId: string; id: string };
    const { role, allocationPercentage, targetTeamId } = req.body;

    const member = await TeamMember.findByPk(memberId, {
      include: [
        { model: Team, as: 'team', include: [{ model: Project, as: 'project' }] },
        { model: Employee, as: 'employee', include: [{ model: EmployeeSkill, as: 'skills' }] },
      ],
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (member.team.projectId !== projectId) {
      res.status(400).json({ error: 'Member does not belong to this project' });
      return;
    }

    if (targetTeamId && targetTeamId !== member.teamId) {
      const targetTeam = await Team.findOne({ where: { id: targetTeamId, projectId } });
      if (!targetTeam) {
        res.status(404).json({ error: 'Target team not found in project' });
        return;
      }
      member.teamId = targetTeamId;
    }

    if (role) member.role = role;
    if (allocationPercentage !== undefined) member.allocationPercentage = allocationPercentage;

    await member.save();
    await member.reload({
      include: [
        { model: Team, as: 'team', include: [{ model: Project, as: 'project' }] },
        { model: Employee, as: 'employee', include: [{ model: EmployeeSkill, as: 'skills' }] },
      ],
    });

    res.json({ message: 'Member updated', member });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const member = await TeamMember.findByPk(memberId);
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    await member.destroy();
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

export const getRoleCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, role } = req.params;
    const { limit = '12', availability } = req.query as { limit?: string; availability?: string };

    const project = await Project.findByPk(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const projectTeams = await Team.findAll({ where: { projectId: id }, attributes: ['id'] });
    const projectTeamIds = projectTeams.map((team) => team.id);

    const assignedMembers = projectTeamIds.length
      ? await TeamMember.findAll({
          where: { teamId: { [Op.in]: projectTeamIds } },
          attributes: ['employeeId'],
        })
      : [];

    const assignedEmployeeIds = new Set(assignedMembers.map((member) => member.employeeId));

    const keywords = deriveRoleKeywords(decodeURIComponent(role));

    const where: any = {
      id: { [Op.notIn]: Array.from(assignedEmployeeIds) },
      isActive: true,
    };

    if (availability === 'available') {
      where.availability = 'available';
    }

    if (role) {
      const normalizedRole = decodeURIComponent(role).toLowerCase();
      where[Op.or] = [
        { designation: { [Op.iLike]: `%${normalizedRole}%` } },
        { department: { [Op.iLike]: `%${normalizedRole}%` } },
      ];
    }

    const skillFilter = keywords.length
      ? {
          [Op.or]: keywords.map((keyword) => ({
            skillName: { [Op.iLike]: `%${keyword}%` },
          })),
        }
      : undefined;

    const candidates = await Employee.findAll({
      where,
      include: [
        {
          model: EmployeeSkill,
          as: 'skills',
          where: skillFilter,
          required: !!skillFilter,
        },
      ],
      order: [
        ['availability', 'ASC'],
        ['currentWorkload', 'ASC'],
      ],
      limit: Number(limit),
    });

    const response = candidates.map((candidate) => {
      const plain = candidate.get({ plain: true }) as any;
      const skillNames: string[] = (plain.skills || []).map((skill: any) => skill.skillName);
      const matchedSkills = keywords.filter((keyword) =>
        skillNames.some((name) => name.toLowerCase().includes(keyword.toLowerCase())),
      );

      const matchScore = keywords.length > 0 ? Number((matchedSkills.length / keywords.length).toFixed(2)) : 0.6;

      return {
        id: plain.id,
        firstName: plain.firstName,
        lastName: plain.lastName,
        email: plain.email,
        designation: plain.designation,
        department: plain.department,
        availability: plain.availability,
        currentWorkload: plain.currentWorkload,
        maxCapacity: plain.maxCapacity,
        velocity: plain.velocity,
        skills: plain.skills || [],
        matchedSkills,
        matchScore,
      };
    });

    res.json({
      projectId: id,
      role: decodeURIComponent(role),
      candidates: response,
    });
  } catch (error) {
    console.error('Get role candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch role candidates' });
  }
};
