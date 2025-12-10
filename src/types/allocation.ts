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
  avatar: string;
  skills: SkillTag[];
  currentWorkload: number; // hours
  maxCapacity: number; // hours per week
  velocity: number; // tasks per week
  availability: 'available' | 'busy' | 'overloaded';
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  projectId: string;
  members: TeamMember[];
}

export interface Project {
  id: string;
  name: string;
  teams: Team[];
}

export interface AIMatch {
  memberId: string;
  confidenceScore: number;
  reasoning: string;
  conflicts: string[];
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
