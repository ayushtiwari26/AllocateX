import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Project, Team, TeamMember, Employee, EmployeeSkill, User } from '../models';
import { Op } from 'sequelize';

type ProjectRequirement = { role: string; count: number };

type GitLabMember = {
  id: number;
  username: string;
  name: string;
  state?: string;
  access_level?: number;
  email?: string;
  web_url?: string;
};

type TeamImportMember = {
  firstName: string;
  lastName: string;
  email: string;
  designation?: string;
  department?: string;
  role?: string;
  allocationPercentage?: number;
};

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

const generateImportEmployeeCode = (index: number) => {
  const ts = Date.now().toString().slice(-6);
  const suffix = `${index}`.padStart(3, '0');
  return `IMP${ts}${suffix}`;
};

const sanitizeEmail = (email: string) => email.trim().toLowerCase();

const parseName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: 'Unknown', lastName: 'User' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'User' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const toSyntheticGitLabEmail = (username: string, gitlabProjectId: number) => {
  const safeUsername = (username || 'unknown').toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `${safeUsername}+gl${gitlabProjectId}@allocatex.local`;
};

const fetchGitLabMembers = async (instanceUrl: string, accessToken: string, projectId: number) => {
  const normalizedInstance = instanceUrl.replace(/\/+$/, '');
  const endpoint = `${normalizedInstance}/api/v4/projects/${projectId}/members/all?per_page=100`;

  const response = await (globalThis as any).fetch(endpoint, {
    headers: {
      'PRIVATE-TOKEN': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitLab API failed with ${response.status}: ${message}`);
  }

  const members = (await response.json()) as GitLabMember[];
  return Array.isArray(members) ? members : [];
};

const getOrCreateTeamForProject = async (projectId: string, teamName?: string) => {
  const resolvedTeamName = teamName?.trim() || 'Core Team';

  let team = await Team.findOne({
    where: {
      projectId,
      name: resolvedTeamName,
    },
  });

  if (!team) {
    team = await Team.create({
      projectId,
      name: resolvedTeamName,
      description: `Auto-created import team (${resolvedTeamName})`,
    });
  }

  return team;
};

const upsertEmployeeFromImport = async (member: TeamImportMember, index: number) => {
  const normalizedEmail = sanitizeEmail(member.email);
  const firstName = member.firstName.trim();
  const lastName = member.lastName.trim();

  let employee = await Employee.findOne({ where: { email: normalizedEmail } });
  if (employee) return employee;

  let user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      role: 'employee',
      displayName: `${firstName} ${lastName}`.trim(),
      firebaseUid: `import-${Date.now()}-${index}`,
      isActive: true,
    });
  }

  employee = await Employee.create({
    userId: user.id,
    employeeCode: generateImportEmployeeCode(index),
    firstName,
    lastName,
    email: normalizedEmail,
    phone: null,
    dateOfJoining: new Date(),
    designation: member.designation?.trim() || 'Developer',
    department: member.department?.trim() || 'Engineering',
    reportingManagerId: null,
    currentWorkload: 0,
    maxCapacity: 40,
    velocity: 10,
    availability: 'available',
    isActive: true,
  });

  return employee;
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

export const getGitLabProjectDevelopers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { instanceUrl, accessToken, gitlabProjectId } = req.body as {
      instanceUrl?: string;
      accessToken?: string;
      gitlabProjectId?: number;
    };

    if (!instanceUrl || !accessToken) {
      res.status(400).json({ error: 'instanceUrl and accessToken are required' });
      return;
    }

    const project = await Project.findByPk(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const resolvedGitLabProjectId = Number(gitlabProjectId || project.gitlabProjectId);
    if (!resolvedGitLabProjectId || Number.isNaN(resolvedGitLabProjectId)) {
      res.status(400).json({ error: 'Project is not linked with a GitLab project ID' });
      return;
    }

    const members = await fetchGitLabMembers(instanceUrl, accessToken, resolvedGitLabProjectId);

    const developers = members
      .filter((member) => (member.access_level || 0) >= 30)
      .map((member) => ({
        gitlabUserId: member.id,
        username: member.username,
        name: member.name,
        email: member.email || null,
        accessLevel: member.access_level || null,
        webUrl: member.web_url || null,
      }));

    await project.update({
      gitlabProjectId: resolvedGitLabProjectId,
    });

    res.json({
      projectId: id,
      gitlabProjectId: resolvedGitLabProjectId,
      developers,
      total: developers.length,
    });
  } catch (error) {
    console.error('Get GitLab developers error:', error);
    res.status(500).json({ error: 'Failed to fetch GitLab developers' });
  }
};

export const importProjectTeamMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { teamName, members } = req.body as { teamName?: string; members?: TeamImportMember[] };

    if (!Array.isArray(members) || members.length === 0) {
      res.status(400).json({ error: 'members must be a non-empty array' });
      return;
    }

    const project = await Project.findByPk(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const team = await getOrCreateTeamForProject(id, teamName);
    const imported: any[] = [];
    const skipped: any[] = [];

    for (let i = 0; i < members.length; i += 1) {
      const raw = members[i];

      if (!raw || !raw.email || !raw.firstName || !raw.lastName) {
        skipped.push({ index: i, reason: 'Missing required fields (firstName, lastName, email)' });
        continue;
      }

      const employee = await upsertEmployeeFromImport(raw, i);

      const exists = await TeamMember.findOne({
        where: {
          teamId: team.id,
          employeeId: employee.id,
        },
      });

      if (exists) {
        skipped.push({ index: i, email: raw.email, reason: 'Already assigned to team' });
        continue;
      }

      const member = await TeamMember.create({
        teamId: team.id,
        employeeId: employee.id,
        role: raw.role?.trim() || 'developer',
        allocationPercentage: raw.allocationPercentage ?? 100,
      });

      imported.push({
        teamMemberId: member.id,
        employeeId: employee.id,
        email: employee.email,
        name: `${employee.firstName} ${employee.lastName}`,
      });
    }

    res.status(201).json({
      message: 'Team members import completed',
      projectId: id,
      teamId: team.id,
      importedCount: imported.length,
      skippedCount: skipped.length,
      imported,
      skipped,
    });
  } catch (error) {
    console.error('Import project team members error:', error);
    res.status(500).json({ error: 'Failed to import team members' });
  }
};

export const importProjectTeamFromGitLab = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { instanceUrl, accessToken, gitlabProjectId, teamName } = req.body as {
      instanceUrl?: string;
      accessToken?: string;
      gitlabProjectId?: number;
      teamName?: string;
    };

    if (!instanceUrl || !accessToken) {
      res.status(400).json({ error: 'instanceUrl and accessToken are required' });
      return;
    }

    const project = await Project.findByPk(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const resolvedGitLabProjectId = Number(gitlabProjectId || project.gitlabProjectId);
    if (!resolvedGitLabProjectId || Number.isNaN(resolvedGitLabProjectId)) {
      res.status(400).json({ error: 'Project is not linked with a GitLab project ID' });
      return;
    }

    const gitlabMembers = await fetchGitLabMembers(instanceUrl, accessToken, resolvedGitLabProjectId);
    const developers = gitlabMembers.filter((member) => (member.access_level || 0) >= 30);

    const normalizedMembers = developers.map((member) => {
        const name = parseName(member.name || member.username || 'Unknown User');
        const resolvedEmail = member.email
          ? sanitizeEmail(member.email)
          : toSyntheticGitLabEmail(member.username || String(member.id), resolvedGitLabProjectId);

        return {
          firstName: name.firstName,
          lastName: name.lastName,
          email: resolvedEmail,
          designation: 'Developer',
          department: 'Engineering',
          role: 'developer',
          allocationPercentage: 100,
          hasGitLabEmail: !!member.email,
          gitlabUserId: member.id,
          username: member.username,
        };
      });

    const syntheticEmailUsers = normalizedMembers
      .filter((member) => !member.hasGitLabEmail)
      .map((member) => ({
        gitlabUserId: member.gitlabUserId,
        username: member.username,
        syntheticEmail: member.email,
      }));

    const team = await getOrCreateTeamForProject(id, teamName);
    const imported: any[] = [];
    const skipped: any[] = [];

    for (let i = 0; i < normalizedMembers.length; i += 1) {
      const member = normalizedMembers[i];
      const employee = await upsertEmployeeFromImport(member, i);

      const exists = await TeamMember.findOne({
        where: {
          teamId: team.id,
          employeeId: employee.id,
        },
      });

      if (exists) {
        skipped.push({ email: employee.email, reason: 'Already assigned to team' });
        continue;
      }

      const created = await TeamMember.create({
        teamId: team.id,
        employeeId: employee.id,
        role: 'developer',
        allocationPercentage: 100,
      });

      imported.push({
        teamMemberId: created.id,
        employeeId: employee.id,
        email: employee.email,
      });
    }

    await project.update({ gitlabProjectId: resolvedGitLabProjectId });

    res.status(201).json({
      message: 'GitLab team import completed',
      projectId: id,
      gitlabProjectId: resolvedGitLabProjectId,
      teamId: team.id,
      importedCount: imported.length,
      skippedCount: skipped.length,
      syntheticEmailCount: syntheticEmailUsers.length,
      syntheticEmailUsers,
      imported,
      skipped,
    });
  } catch (error) {
    console.error('Import project team from GitLab error:', error);
    res.status(500).json({ error: 'Failed to import project team from GitLab' });
  }
};
