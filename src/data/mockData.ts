import { Task, TeamMember, Team, Project, Assignment, Priority } from '@/types/allocation';

const skillTags = [
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker',
  'GraphQL', 'PostgreSQL', 'MongoDB', 'UI/UX', 'Testing', 'DevOps'
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement User Authentication',
    description: 'Build OAuth2 integration with social providers',
    priority: 'high',
    estimatedHours: 16,
    requiredSkills: ['React', 'Node.js', 'TypeScript'],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    projectId: 'proj-1'
  },
  {
    id: 'task-2',
    title: 'Database Migration Script',
    description: 'Create migration for new user schema',
    priority: 'critical',
    estimatedHours: 8,
    requiredSkills: ['PostgreSQL', 'Node.js'],
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    projectId: 'proj-1'
  },
  {
    id: 'task-3',
    title: 'Design System Components',
    description: 'Build reusable component library',
    priority: 'medium',
    estimatedHours: 24,
    requiredSkills: ['React', 'TypeScript', 'UI/UX'],
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    projectId: 'proj-1'
  },
  {
    id: 'task-4',
    title: 'API Performance Optimization',
    description: 'Optimize slow endpoints and add caching',
    priority: 'high',
    estimatedHours: 12,
    requiredSkills: ['Node.js', 'PostgreSQL', 'AWS'],
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    projectId: 'proj-2'
  },
  {
    id: 'task-5',
    title: 'CI/CD Pipeline Setup',
    description: 'Configure automated deployment pipeline',
    priority: 'medium',
    estimatedHours: 10,
    requiredSkills: ['DevOps', 'Docker', 'AWS'],
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    projectId: 'proj-2'
  },
  {
    id: 'task-6',
    title: 'Unit Test Coverage',
    description: 'Increase test coverage to 80%',
    priority: 'low',
    estimatedHours: 20,
    requiredSkills: ['Testing', 'TypeScript', 'React'],
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    projectId: 'proj-1'
  }
];

export const mockMembers: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Sarah Chen',
    role: 'Senior Frontend Engineer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    skills: ['React', 'TypeScript', 'UI/UX', 'Testing'],
    currentWorkload: 25,
    maxCapacity: 40,
    velocity: 3.5,
    availability: 'available',
    teamId: 'team-1'
  },
  {
    id: 'member-2',
    name: 'Marcus Johnson',
    role: 'Backend Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    skills: ['Node.js', 'PostgreSQL', 'GraphQL', 'AWS'],
    currentWorkload: 38,
    maxCapacity: 40,
    velocity: 4.0,
    availability: 'busy',
    teamId: 'team-1'
  },
  {
    id: 'member-3',
    name: 'Emily Rodriguez',
    role: 'Full Stack Developer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    currentWorkload: 42,
    maxCapacity: 40,
    velocity: 3.0,
    availability: 'overloaded',
    teamId: 'team-1'
  },
  {
    id: 'member-4',
    name: 'David Kim',
    role: 'DevOps Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    skills: ['DevOps', 'Docker', 'AWS', 'Python'],
    currentWorkload: 20,
    maxCapacity: 40,
    velocity: 3.8,
    availability: 'available',
    teamId: 'team-2'
  },
  {
    id: 'member-5',
    name: 'Aisha Patel',
    role: 'UI Designer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    skills: ['UI/UX', 'React', 'TypeScript', 'Testing'],
    currentWorkload: 15,
    maxCapacity: 40,
    velocity: 4.2,
    availability: 'available',
    teamId: 'team-2'
  },
  {
    id: 'member-6',
    name: 'James Wilson',
    role: 'Backend Engineer',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
    skills: ['PostgreSQL', 'Node.js', 'Python', 'AWS'],
    currentWorkload: 32,
    maxCapacity: 40,
    velocity: 3.2,
    availability: 'busy',
    teamId: 'team-2'
  }
];

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Frontend Squad',
    projectId: 'proj-1',
    members: mockMembers.filter(m => m.teamId === 'team-1')
  },
  {
    id: 'team-2',
    name: 'Backend Squad',
    projectId: 'proj-2',
    members: mockMembers.filter(m => m.teamId === 'team-2')
  }
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-Commerce Platform',
    teams: mockTeams.filter(t => t.projectId === 'proj-1')
  },
  {
    id: 'proj-2',
    name: 'Analytics Dashboard',
    teams: mockTeams.filter(t => t.projectId === 'proj-2')
  }
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    taskId: 'task-1',
    memberId: 'member-1',
    assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    mode: 'auto',
    assignedBy: 'AI System',
    aiMatchScore: 0.92
  },
  {
    id: 'assign-2',
    taskId: 'task-2',
    memberId: 'member-2',
    assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    mode: 'manual',
    assignedBy: 'John Doe'
  }
];
