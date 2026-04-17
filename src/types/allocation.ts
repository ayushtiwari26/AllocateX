export type AllocationMode = 'auto' | 'manual';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type SkillTag = string;

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedHours: number;
  requiredSkills: SkillTag[];
  deadline: Date;
  projectId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: SkillTag[];
  currentWorkload: number; // hours
  maxCapacity: number; // hours per week
  velocity: number; // tasks per week
  availability: 'available' | 'busy' | 'overloaded';
  teamId: string;
  allocationPercentage?: number;
  employeeId?: string;
}

export interface ProjectRequirement {
  role: string;
  count: number;
}

export interface Team {
  id: string;
  name: string;
  projectId: string;
  members: TeamMember[];
  requirements?: ProjectRequirement[];
  description?: string;
  leadId?: string;
  leadName?: string;
}

export interface Project {
  id: string;
  name: string;
  teams: Team[];
  requirements?: ProjectRequirement[];
  organisationId?: string;
  description?: string;
  status?: 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  managerId?: string;
  managerName?: string;
  startDate?: string;
  endDate?: string;
}

export interface AIMatch {
  memberId: string;
  confidenceScore: number;
  reasoning: string;
  conflicts: string[];
}

export interface TeamAssignmentInput {
  employeeId: string;
  role: string;
  allocationPercentage?: number;
}

export interface Assignment {
  id: string;
  taskId: string;
  memberId: string;
  assignedAt: Date;
  mode: AllocationMode;
  assignedBy: string;
  aiMatchScore?: number;
}

export interface WorkloadImpact {
  currentWorkload: number;
  newWorkload: number;
  utilizationPercentage: number;
  conflicts: string[];
}
