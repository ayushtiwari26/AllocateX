import { Task, TeamMember, Team, Project, Assignment, Priority } from '@/types/allocation';

const skillTags = [
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker',
  'GraphQL', 'PostgreSQL', 'MongoDB', 'UI/UX', 'Testing', 'DevOps',
  'Rust', 'Go', 'Flutter', 'Angular', 'Vue.js', 'Java', 'Spring'
];

// --- Members (20 Total) ---
// 2 Co-founders, 3 PMs, 5 Team Leads, 10 Developers

export const mockMembers: TeamMember[] = [
  // Co-founders
  {
    id: 'm-cf-1', name: 'Eleanor Sterling', role: 'Co-Founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eleanor',
    skills: ['Strategy', 'Product', 'Management'], currentWorkload: 45, maxCapacity: 50, velocity: 5, availability: 'busy', teamId: 'team-lead'
  },
  {
    id: 'm-cf-2', name: 'Rajiv Kapoor', role: 'Co-Founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajiv',
    skills: ['Tech Strategy', 'Architecture', 'Networking'], currentWorkload: 40, maxCapacity: 40, velocity: 5, availability: 'available', teamId: 'team-lead'
  },
  // Project Managers (3)
  {
    id: 'm-pm-1', name: 'Sarah Jenkins', role: 'Project Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    skills: ['Agile', 'Scrum', 'Planning'], currentWorkload: 35, maxCapacity: 40, velocity: 4, availability: 'available', teamId: 'team-pm'
  },
  {
    id: 'm-pm-2', name: 'Michael Chang', role: 'Project Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    skills: ['Risk Management', 'JIRA', 'Communication'], currentWorkload: 38, maxCapacity: 40, velocity: 4, availability: 'busy', teamId: 'team-pm'
  },
  {
    id: 'm-pm-3', name: 'Amara Ndiaye', role: 'Project Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara',
    skills: ['Kanban', 'Leadership', 'Roadmapping'], currentWorkload: 20, maxCapacity: 40, velocity: 4, availability: 'available', teamId: 'team-pm'
  },
  // Team Leads (5)
  {
    id: 'm-lead-1', name: 'David Kim', role: 'Team Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    skills: ['React', 'TypeScript', 'Architecture'], currentWorkload: 40, maxCapacity: 40, velocity: 4.5, availability: 'busy', teamId: 'team-1'
  },
  {
    id: 'm-lead-2', name: 'Elena Rodriguez', role: 'Team Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    skills: ['Node.js', 'AWS', 'System Design'], currentWorkload: 42, maxCapacity: 40, velocity: 4.5, availability: 'overloaded', teamId: 'team-2'
  },
  {
    id: 'm-lead-3', name: 'James Wilson', role: 'Team Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    skills: ['Python', 'Django', 'ML'], currentWorkload: 30, maxCapacity: 40, velocity: 4.5, availability: 'available', teamId: 'team-3'
  },
  {
    id: 'm-lead-4', name: 'Anita Patel', role: 'Team Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita',
    skills: ['DevOps', 'Kubernetes', 'Go'], currentWorkload: 35, maxCapacity: 40, velocity: 4.5, availability: 'available', teamId: 'team-4'
  },
  {
    id: 'm-lead-5', name: 'Robert Chen', role: 'Team Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    skills: ['Mobile', 'Flutter', 'iOS'], currentWorkload: 39, maxCapacity: 40, velocity: 4.5, availability: 'busy', teamId: 'team-5'
  },
  // Developers (10)
  { id: 'm-dev-1', name: 'Alice Freeman', role: 'Senior Frontend Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', skills: ['React', 'CSS', 'Figma'], currentWorkload: 30, maxCapacity: 40, velocity: 3.5, availability: 'available', teamId: 'team-1' },
  { id: 'm-dev-2', name: 'Bob Smith', role: 'Backend Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', skills: ['Node.js', 'SQL'], currentWorkload: 40, maxCapacity: 40, velocity: 3.0, availability: 'busy', teamId: 'team-1' },
  { id: 'm-dev-3', name: 'Charlie Davis', role: 'Full Stack Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', skills: ['React', 'Node.js'], currentWorkload: 20, maxCapacity: 40, velocity: 3.2, availability: 'available', teamId: 'team-2' },
  { id: 'm-dev-4', name: 'Diana Prince', role: 'DevOps Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana', skills: ['AWS', 'Terraform'], currentWorkload: 10, maxCapacity: 40, velocity: 3.8, availability: 'available', teamId: 'team-2' },
  { id: 'm-dev-5', name: 'Evan Wright', role: 'Frontend Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Evan', skills: ['Vue.js', 'Tailwind'], currentWorkload: 35, maxCapacity: 40, velocity: 3.0, availability: 'available', teamId: 'team-3' },
  { id: 'm-dev-6', name: 'Fiona Gallagher', role: 'Backend Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona', skills: ['Python', 'FastAPI'], currentWorkload: 45, maxCapacity: 40, velocity: 3.5, availability: 'overloaded', teamId: 'team-3' },
  { id: 'm-dev-7', name: 'George Miller', role: 'Mobile Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George', skills: ['Flutter', 'Dart'], currentWorkload: 25, maxCapacity: 40, velocity: 3.0, availability: 'available', teamId: 'team-4' },
  { id: 'm-dev-8', name: 'Hannah Lee', role: 'QA Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah', skills: ['Testing', 'Cypress'], currentWorkload: 30, maxCapacity: 40, velocity: 3.0, availability: 'available', teamId: 'team-4' },
  { id: 'm-dev-9', name: 'Ian Scott', role: 'Full Stack Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ian', skills: ['Next.js', 'PostgreSQL'], currentWorkload: 38, maxCapacity: 40, velocity: 3.5, availability: 'busy', teamId: 'team-5' },
  { id: 'm-dev-10', name: 'Julia Roberts', role: 'UI Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia', skills: ['Figma', 'Prototyping'], currentWorkload: 15, maxCapacity: 40, velocity: 4.0, availability: 'available', teamId: 'team-5' },
];

// --- Projects (15) ---
// Two main "products" could be represented as naming conventions or just distinct big projects.
const projectNames = [
  'E-Commerce Platform', 'Analytics Dashboard', 'Mobile App Redesign', 'Internal Tools Suite', 'Customer Portal',
  'Marketing Website', 'Legacy Migration', 'AI Integration Module', 'Blockchain Prototype', 'Cloud Infrastructure',
  'Design System 2.0', 'Payment Gateway Integration', 'HR Management System', 'Inventory Tracker', 'Social Media Bot'
];

export const mockTeams: Team[] = [
  { id: 'team-lead', name: 'Leadership', projectId: 'proj-1', members: mockMembers.slice(0, 2) },
  { id: 'team-pm', name: 'Product Management', projectId: 'proj-1', members: mockMembers.slice(2, 5) },
  { id: 'team-1', name: 'Alpha Squad', projectId: 'proj-1', members: [mockMembers[5], mockMembers[10], mockMembers[11]] }, // David + Alice + Bob
  { id: 'team-2', name: 'Beta Squad', projectId: 'proj-2', members: [mockMembers[6], mockMembers[12], mockMembers[13]] }, // Elena + Charlie + Diana
  { id: 'team-3', name: 'Gamma Squad', projectId: 'proj-3', members: [mockMembers[7], mockMembers[14], mockMembers[15]] }, // James + Evan + Fiona
  { id: 'team-4', name: 'Delta Squad', projectId: 'proj-4', members: [mockMembers[8], mockMembers[16], mockMembers[17]] }, // Anita + George + Hannah
  { id: 'team-5', name: 'Epsilon Squad', projectId: 'proj-5', members: [mockMembers[9], mockMembers[18], mockMembers[19]] }, // Robert + Ian + Julia
];

// Generate 15 Projects
export const mockProjects: Project[] = projectNames.map((name, index) => {
  const pid = `proj-${index + 1}`;
  // Assign random teams to projects for demo purposes, or just empty teams for extra projects
  const assignedTeams = mockTeams.filter(t => t.projectId === pid);

  return {
    id: pid,
    name: name,
    teams: assignedTeams,
    requirements: [
      { role: 'Frontend Engineer', count: 2 },
      { role: 'Backend Engineer', count: 1 }
    ]
  };
});


// Mock Tasks (just a few for visibility)
export const mockTasks: Task[] = [
  { id: 't-1', title: 'Setup Repo', description: 'Init git', priority: 'high', estimatedHours: 4, requiredSkills: ['DevOps'], deadline: new Date(Date.now() + 86400000), projectId: 'proj-1' },
  { id: 't-2', title: 'Login Page', description: 'Create login', priority: 'critical', estimatedHours: 12, requiredSkills: ['React'], deadline: new Date(Date.now() + 172800000), projectId: 'proj-1' },
];

export const mockAssignments: Assignment[] = [
  { id: 'a-1', taskId: 't-2', memberId: 'm-dev-1', assignedAt: new Date(), mode: 'auto', assignedBy: 'AI', aiMatchScore: 0.95 },
  { id: 'a-2', taskId: 't-1', memberId: 'm-dev-4', assignedAt: new Date(Date.now() - 3600000), mode: 'manual', assignedBy: 'PM' },
];
