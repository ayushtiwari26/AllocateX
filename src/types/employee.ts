export interface EmployeeProfile {
    id: string;

    // Basic Information
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;

    // Professional Details
    role: 'Developer' | 'QA' | 'DevOps' | 'Team Lead' | 'Project Manager' | 'Designer' | 'Data Engineer' | 'ML Engineer';
    department: string;
    employeeId: string;
    joinDate: string;

    // Skills & Experience
    skills: Skill[];
    yearsOfExperience: number;
    pastProjects: PastProject[];
    strongAreas: string[];
    techStack: string[];
    certifications?: Certification[];

    // Current Status
    currentWorkload: number; // hours per week
    maxCapacity: number; // hours per week
    velocity: number; // story points per sprint
    availability: 'available' | 'busy' | 'overloaded' | 'on-leave';

    // Leave & Availability
    leaveStatus?: LeaveStatus;
    upcomingLeaves?: Leave[];

    // Project Allocations
    allocatedProjects: ProjectAllocation[];

    // Metrics
    completedTasks: number;
    ongoingTasks: number;
    averageTaskCompletionTime: number; // in days
    qualityScore: number; // 0-100
    collaborationScore: number; // 0-100

    // Metadata
    organisationId: string;
    teamId?: string;
    managerId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Skill {
    name: string;
    category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Testing' | 'Design' | 'Mobile' | 'ML/AI' | 'Other';
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    yearsOfExperience: number;
    lastUsed?: string; // ISO date
}

export interface PastProject {
    name: string;
    role: string;
    duration: string; // e.g., "6 months"
    technologies: string[];
    description?: string;
    achievements?: string[];
}

export interface Certification {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
}

export interface LeaveStatus {
    isOnLeave: boolean;
    leaveType?: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity';
    startDate?: string;
    endDate?: string;
    reason?: string;
}

export interface Leave {
    id: string;
    type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity';
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
}

export interface ProjectAllocation {
    projectId: string;
    projectName: string;
    roleInProject: string;
    allocationPercentage: number; // 0-100
    startDate: string;
    endDate?: string;
    isActive: boolean;
    currentSprintTasks: SprintTask[];
    hoursAllocated: number;
}

export interface SprintTask {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    storyPoints: number;
    estimatedHours: number;
    actualHours?: number;
    assignedDate: string;
    dueDate?: string;
    completedDate?: string;
}

export interface EmployeeComparison {
    employeeId: string;
    comparedWith: string[];
    skillComparisons: SkillComparison[];
    workloadComparison: WorkloadComparison;
    experienceComparison: ExperienceComparison;
    velocityComparison: VelocityComparison;
    utilizationStatus: 'underutilized' | 'optimal' | 'overloaded';
}

export interface SkillComparison {
    skill: string;
    myProficiency: string;
    comparisons: {
        employeeId: string;
        employeeName: string;
        proficiency: string;
        isStronger: boolean;
    }[];
}

export interface WorkloadComparison {
    myWorkload: number;
    myCapacity: number;
    myUtilization: number; // percentage
    comparisons: {
        employeeId: string;
        employeeName: string;
        workload: number;
        capacity: number;
        utilization: number;
        difference: number; // hours difference
    }[];
}

export interface ExperienceComparison {
    myExperience: number;
    comparisons: {
        employeeId: string;
        employeeName: string;
        experience: number;
        difference: number; // years
    }[];
}

export interface VelocityComparison {
    myVelocity: number;
    comparisons: {
        employeeId: string;
        employeeName: string;
        velocity: number;
        difference: number;
    }[];
}

export interface ProjectImpactAnalysis {
    projectId: string;
    projectName: string;
    currentRole: string;
    impactIfRemoved: {
        timelineImpact: string; // e.g., "2 weeks delay"
        riskScore: number; // 0-100
        criticalTasks: number;
        affectedSprints: number;
        skillGap: string[];
    };
    suggestedReplacements: ReplacementSuggestion[];
}

export interface ReplacementSuggestion {
    employeeId: string;
    employeeName: string;
    matchScore: number; // 0-100
    matchingSkills: string[];
    missingSkills: string[];
    currentWorkload: number;
    availableCapacity: number;
    riskOfReplacement: 'low' | 'medium' | 'high';
    reasoning: string;
}

export interface ActivityLog {
    id: string;
    employeeId: string;
    timestamp: string;
    type: 'task_completed' | 'project_assigned' | 'skill_updated' | 'leave_requested' | 'sprint_contribution' | 'other';
    description: string;
    metadata?: any;
}
