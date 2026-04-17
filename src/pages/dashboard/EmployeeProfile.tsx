import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeApi, type EmployeeSkillRecord, type EmployeeTeamMembershipRecord } from '@/services/api';
import type { EmployeeProfile as EmployeeProfileType, ActivityLog, Skill } from '@/types/employee';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Calendar, Briefcase, TrendingUp, Clock, CalendarDays, Wallet, Zap, Target, Award, ChevronRight, Sparkles, Activity, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileOverview from '@/components/employee/ProfileOverview';
import SkillsExperience from '@/components/employee/SkillsExperience';
import AllocatedProjects from '@/components/employee/AllocatedProjects';
import DependencyComparison from '@/components/employee/DependencyComparison';
import ActivityHistory from '@/components/employee/ActivityHistory';
import AttendanceTab from '@/components/employee/tabs/AttendanceTab';
import LeaveTab from '@/components/employee/tabs/LeaveTab';
import FinanceTab from '@/components/employee/tabs/FinanceTab';
import { differenceInYears, format } from 'date-fns';

const PROFICIENCY_LABEL_MAP: Record<EmployeeSkillRecord['proficiency'], Skill['proficiency']> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert'
};

const PROFICIENCY_ORDER: Skill['proficiency'][] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const AVAILABILITY_MAP: Record<'available' | 'partially-available' | 'unavailable', EmployeeProfileType['availability']> = {
    'available': 'available',
    'partially-available': 'busy',
    'unavailable': 'overloaded'
};

const categorizeSkill = (name: string): Skill['category'] => {
    const lower = name.toLowerCase();
    if (['react', 'vue', 'angular', 'css', 'html', 'tailwind', 'frontend', 'next.js'].some(token => lower.includes(token))) {
        return 'Frontend';
    }
    if (['node', 'python', 'java', 'api', 'backend', 'go', 'service', 'fastapi', 'graphql'].some(token => lower.includes(token))) {
        return 'Backend';
    }
    if (['sql', 'database', 'postgres', 'mysql', 'mongodb', 'data pipeline'].some(token => lower.includes(token))) {
        return 'Database';
    }
    if (['aws', 'docker', 'kubernetes', 'devops', 'ci/cd', 'terraform', 'infrastructure'].some(token => lower.includes(token))) {
        return 'DevOps';
    }
    if (['qa', 'testing', 'cypress', 'automation', 'quality'].some(token => lower.includes(token))) {
        return 'Testing';
    }
    if (['figma', 'design', 'prototype', 'ux', 'ui'].some(token => lower.includes(token))) {
        return 'Design';
    }
    if (['mobile', 'flutter', 'android', 'ios'].some(token => lower.includes(token))) {
        return 'Mobile';
    }
    if (['ml', 'ai', 'machine learning', 'data'].some(token => lower.includes(token))) {
        return 'ML/AI';
    }
    return 'Other';
};

const normalizeDate = (value?: string | Date | null): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    return new Date(value);
};

const createSprintTasksForProject = (projectKey: string, projectName: string, skills: Skill[], seed: number) => {
    const statuses: Array<'todo' | 'in-progress' | 'review' | 'done'> = ['in-progress', 'review', 'todo', 'done'];
    const priorities: Array<'low' | 'medium' | 'high' | 'critical'> = ['high', 'medium', 'critical', 'medium'];
    const baseSkills = skills.length > 0 ? skills.slice(0, 3) : [{ name: 'Core Delivery', category: 'Other', proficiency: 'Advanced', yearsOfExperience: 3 } as Skill];

    return baseSkills.map((skill, idx) => {
        const taskIndex = idx + seed;
        return {
            id: `${projectKey}-task-${taskIndex}`,
            title: `${skill.name} milestone ${taskIndex + 1}`,
            description: `Advance ${skill.name} capabilities within ${projectName}.`,
            status: statuses[(idx + seed) % statuses.length],
            priority: priorities[(idx + seed) % priorities.length],
            storyPoints: 3 + ((idx + seed) % 5),
            estimatedHours: 6 + ((idx + seed) % 4) * 2,
            assignedDate: new Date().toISOString(),
            dueDate: undefined,
            completedDate: undefined,
        };
    });
};

const formatDurationRange = (start: string, end?: string) => {
    const startDate = normalizeDate(start);
    const endDate = end ? normalizeDate(end) : null;
    const startLabel = format(startDate, 'MMM yyyy');
    const endLabel = endDate ? format(endDate, 'MMM yyyy') : 'Present';
    return `${startLabel} - ${endLabel}`;
};

const mapRoleToProfileRole = (designation?: string): EmployeeProfileType['role'] => {
    if (!designation) return 'Developer';
    const lower = designation.toLowerCase();
    if (lower.includes('qa') || lower.includes('quality')) return 'QA';
    if (lower.includes('devops') || lower.includes('infrastructure')) return 'DevOps';
    if (lower.includes('project manager') || lower.includes('program manager')) return 'Project Manager';
    if (lower.includes('team lead') || lower.includes('lead')) return 'Team Lead';
    if (lower.includes('designer') || lower.includes('design')) return 'Designer';
    if (lower.includes('data')) return 'Data Engineer';
    if (lower.includes('ml') || lower.includes('ai')) return 'ML Engineer';
    return 'Developer';
};

export default function EmployeeProfile() {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<EmployeeProfileType | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('overview');

    useEffect(() => {
        const loadProfile = async () => {
            if (!employeeId) return;
            try {
                const data = await employeeApi.getById(employeeId);

                const skillsRecords: EmployeeSkillRecord[] = (data.skills ?? []) as EmployeeSkillRecord[];
                const profileSkills: Skill[] = skillsRecords.map(skill => ({
                    name: skill.skillName,
                    category: categorizeSkill(skill.skillName),
                    proficiency: PROFICIENCY_LABEL_MAP[skill.proficiency] ?? 'Intermediate',
                    yearsOfExperience: Number(skill.yearsOfExperience ?? 0),
                }));

                const effectiveSkills = profileSkills.length > 0
                    ? profileSkills
                    : [{
                        name: data.designation || 'Cross-functional Delivery',
                        category: categorizeSkill(data.designation || 'Delivery'),
                        proficiency: 'Advanced' as Skill['proficiency'],
                        yearsOfExperience: 3,
                    }];

                const techStack = Array.from(new Set(effectiveSkills.map(skill => skill.name)));

                const sortedByStrength = [...effectiveSkills].sort((a, b) => {
                    const proficiencyDiff = PROFICIENCY_ORDER.indexOf(b.proficiency) - PROFICIENCY_ORDER.indexOf(a.proficiency);
                    if (proficiencyDiff !== 0) return proficiencyDiff;
                    return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
                });
                const strongAreas = sortedByStrength.slice(0, Math.min(sortedByStrength.length, 3)).map(skill => skill.name);

                const memberships: EmployeeTeamMembershipRecord[] = (data.teamMemberships ?? []) as EmployeeTeamMembershipRecord[];
                const sortedMemberships = memberships
                    .filter(m => m.team)
                    .sort((a, b) => normalizeDate(b.joinedAt).getTime() - normalizeDate(a.joinedAt).getTime());

                const allocationDetails = sortedMemberships.map((membership, index) => {
                    const project = membership.team?.project;
                    const projectName = project?.name ?? membership.team?.name ?? 'Strategic Initiative';
                    const projectKey = project?.id ?? membership.teamId;
                    const tasks = createSprintTasksForProject(projectKey, projectName, effectiveSkills, index);
                    const allocationPercentage = membership.allocationPercentage ?? 100;
                    const workloadBase = data.currentWorkload ?? 32;
                    const hoursAllocated = Math.max(6, Math.round(workloadBase * allocationPercentage / 100));

                    return {
                        membership,
                        tasks,
                        projectDescription: project?.description || membership.team?.description || '',
                        allocation: {
                            projectId: project?.id ?? membership.teamId,
                            projectName,
                            roleInProject: membership.role,
                            allocationPercentage,
                            startDate: membership.joinedAt,
                            endDate: membership.leftAt ?? undefined,
                            isActive: membership.isActive ?? true,
                            currentSprintTasks: tasks.map((task, taskIdx) => ({
                                ...task,
                                actualHours: task.status === 'done' ? task.estimatedHours - 1 : undefined,
                                storyPoints: task.storyPoints,
                                estimatedHours: task.estimatedHours,
                                assignedDate: normalizeDate(task.assignedDate).toISOString(),
                                id: `${projectKey}-task-${taskIdx}-${index}`,
                            })),
                            hoursAllocated,
                        } as EmployeeProfileType['allocatedProjects'][number],
                    };
                });

                let profileAllocations = allocationDetails.map(detail => detail.allocation);
                let allocationMeta = allocationDetails;

                if (profileAllocations.length === 0) {
                    const fallbackTasks = createSprintTasksForProject(data.id, 'Strategic Operations', effectiveSkills, 0);
                    const fallbackAllocation: EmployeeProfileType['allocatedProjects'][number] = {
                        projectId: `${data.id}-strategic`,
                        projectName: 'Strategic Operations',
                        roleInProject: data.designation || 'Core Contributor',
                        allocationPercentage: 80,
                        startDate: normalizeDate(data.dateOfJoining).toISOString(),
                        endDate: undefined,
                        isActive: true,
                        currentSprintTasks: fallbackTasks.map((task, idx) => ({
                            ...task,
                            id: `${data.id}-task-${idx}`,
                            actualHours: task.status === 'done' ? task.estimatedHours - 1 : undefined,
                            assignedDate: normalizeDate(task.assignedDate).toISOString(),
                        })),
                        hoursAllocated: Math.max(6, Math.round((data.currentWorkload ?? 32) * 0.8)),
                    };
                    profileAllocations = [fallbackAllocation];
                    allocationMeta = [{
                        membership: {
                            teamId: `${data.id}-strategic-team`,
                            employeeId: data.id,
                            role: fallbackAllocation.roleInProject,
                            allocationPercentage: 80,
                            joinedAt: fallbackAllocation.startDate,
                            isActive: true,
                        } as EmployeeTeamMembershipRecord,
                        tasks: fallbackTasks,
                        projectDescription: 'Strategic initiatives supporting cross-functional delivery.',
                        allocation: fallbackAllocation,
                    }];
                }

                const allTasks = profileAllocations.flatMap(allocation => allocation.currentSprintTasks);

                const pastProjects = allocationMeta.map(detail => ({
                    name: detail.allocation.projectName,
                    role: detail.allocation.roleInProject,
                    duration: formatDurationRange(detail.allocation.startDate, detail.allocation.endDate),
                    technologies: techStack.slice(0, 5),
                    description: detail.projectDescription,
                    achievements: [
                        `Maintained ${detail.allocation.allocationPercentage}% allocation with steady delivery`,
                        `Closed ${detail.allocation.currentSprintTasks.filter(task => task.status === 'done').length} sprint tasks`
                    ],
                }));

                const joinDateValue = data.dateOfJoining || data.joiningDate || new Date().toISOString();
                const joinDateISO = normalizeDate(joinDateValue).toISOString();
                const yearsOfExperience = Math.max(1, differenceInYears(new Date(), normalizeDate(joinDateValue)) + 2);

                const completedTasks = allTasks.filter(task => task.status === 'done').length;
                const ongoingTasks = allTasks.filter(task => task.status === 'in-progress' || task.status === 'review').length;
                const averageTaskCompletionTime = Math.max(2, Math.round(allTasks.reduce((sum, task) => sum + task.estimatedHours, 0) / Math.max(allTasks.length, 1) / 2));
                const qualityScore = Math.min(95, 82 + completedTasks * 2);
                const collaborationScore = Math.min(95, 80 + profileAllocations.length * 3);

                const role = mapRoleToProfileRole(data.designation);

                const profile: EmployeeProfileType = {
                    id: data.id,
                    fullName: `${data.firstName} ${data.lastName}`.trim(),
                    email: data.email,
                    phone: data.phone || undefined,
                    location: data.department ? `${data.department} • Remote` : 'Remote',
                    avatar: (data as any).profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${data.firstName} ${data.lastName}`)}`,
                    role,
                    department: data.department || 'Engineering',
                    employeeId: data.employeeCode,
                    joinDate: joinDateISO,
                    skills: effectiveSkills,
                    yearsOfExperience,
                    pastProjects,
                    strongAreas: strongAreas.length ? strongAreas : techStack.slice(0, 3),
                    techStack: techStack.length ? techStack : ['Cross-functional Collaboration'],
                    certifications: undefined,
                    currentWorkload: data.currentWorkload ?? 0,
                    maxCapacity: data.maxCapacity ?? 40,
                    velocity: data.velocity ?? 8,
                    availability: AVAILABILITY_MAP[data.availability] ?? 'available',
                    leaveStatus: { isOnLeave: false },
                    allocatedProjects: profileAllocations,
                    completedTasks,
                    ongoingTasks,
                    averageTaskCompletionTime,
                    qualityScore,
                    collaborationScore,
                    organisationId: '',
                    teamId: allocationMeta[0]?.membership.teamId,
                    managerId: data.reportingManager?.id || undefined,
                    createdAt: (data as any).createdAt?.toString() || new Date().toISOString(),
                    updatedAt: (data as any).updatedAt?.toString() || new Date().toISOString(),
                };

                const activityLogs: ActivityLog[] = [];

                allocationMeta.forEach((detail, idx) => {
                    activityLogs.push({
                        id: `project-${detail.allocation.projectId}-${idx}`,
                        employeeId: data.id,
                        timestamp: detail.allocation.startDate,
                        type: 'project_assigned',
                        description: `Joined ${detail.allocation.projectName} as ${detail.allocation.roleInProject}`,
                        metadata: {
                            allocation: `${detail.allocation.allocationPercentage}%`,
                            projectId: detail.allocation.projectId,
                        },
                    });

                    detail.allocation.currentSprintTasks
                        .filter(task => task.status === 'done')
                        .slice(0, 3)
                        .forEach((task, taskIdx) => {
                            activityLogs.push({
                                id: `task-${task.id}-${taskIdx}`,
                                employeeId: data.id,
                                timestamp: new Date().toISOString(),
                                type: 'task_completed',
                                description: `Completed ${task.title} for ${detail.allocation.projectName}`,
                                metadata: {
                                    project: detail.allocation.projectName,
                                    storyPoints: task.storyPoints,
                                },
                            });
                        });
                });

                if (profileSkills.length > 0) {
                    const topSkill = sortedByStrength[0];
                    activityLogs.push({
                        id: `skill-${data.id}-${topSkill.name}`,
                        employeeId: data.id,
                        timestamp: new Date().toISOString(),
                        type: 'skill_updated',
                        description: `Updated proficiency in ${topSkill.name}`,
                        metadata: {
                            proficiency: topSkill.proficiency,
                            experience: `${topSkill.yearsOfExperience} years`,
                        },
                    });
                }

                activityLogs.push({
                    id: `sprint-${data.id}`,
                    employeeId: data.id,
                    timestamp: new Date().toISOString(),
                    type: 'sprint_contribution',
                    description: `Contributed to ${profileAllocations.length} active initiative${profileAllocations.length > 1 ? 's' : ''}`,
                    metadata: {
                        completedTasks,
                        ongoingTasks,
                    },
                });

                setProfile(profile);
                setActivities(activityLogs);
            } catch (error) {
                console.error('Error loading employee:', error);
                setProfile(null);
                setActivities([]);
            }
        };

        loadProfile();
    }, [employeeId]);

    if (!profile) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium mb-1">Employee not found</p>
                    <p className="text-sm text-slate-400 mb-4">The profile you're looking for doesn't exist</p>
                    <Button onClick={() => navigate('/dashboard/employees')} className="bg-indigo-600 hover:bg-indigo-700">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Employees
                    </Button>
                </div>
            </div>
        );
    }
    const utilizationPercentage = (profile.currentWorkload / profile.maxCapacity) * 100;
    const getUtilizationColor = () => {
        if (utilizationPercentage < 70) return 'from-amber-500 to-orange-500';
        if (utilizationPercentage <= 90) return 'from-emerald-500 to-teal-500';
        return 'from-red-500 to-rose-500';
    };
    
    const getUtilizationBg = () => {
        if (utilizationPercentage < 70) return 'bg-amber-50 border-amber-200 text-amber-700';
        if (utilizationPercentage <= 90) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
        return 'bg-red-50 border-red-200 text-red-700';
    };

    const getAvailabilityBadge = () => {
        const colors = {
            'available': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'busy': 'bg-amber-100 text-amber-700 border-amber-200',
            'overloaded': 'bg-red-100 text-red-700 border-red-200',
            'on-leave': 'bg-slate-100 text-slate-700 border-slate-200'
        };
        return colors[profile.availability];
    };

    const handleDelete = () => {
        if (confirm(`Delete ${profile.fullName}'s profile? This cannot be undone.`)) {
            console.warn('Delete profile not implemented yet for backend data');
            navigate('/dashboard/employees');
        }
    };

    return (
        <div className="h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col overflow-hidden">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08),transparent_60%)] opacity-50" />
                
                <div className="relative px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    {/* Mobile: Back button row */}
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/dashboard/employees')}
                            className="text-white/80 hover:text-white hover:bg-white/10 -ml-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className="bg-white/10 hover:bg-white/20 text-white border-0 h-8 sm:h-9"
                            >
                                <Edit className="w-4 h-4 sm:mr-1.5" />
                                <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleDelete}
                                className="bg-red-500/20 hover:bg-red-500/30 text-white border-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <div className="relative flex-shrink-0">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white/20 shadow-2xl">
                                <AvatarImage src={profile.avatar} alt={profile.fullName} />
                                <AvatarFallback className="bg-white text-indigo-700 text-xl sm:text-2xl font-bold">
                                    {profile.fullName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white flex items-center justify-center ${
                                profile.availability === 'available' ? 'bg-emerald-500' : 
                                profile.availability === 'busy' ? 'bg-amber-500' : 'bg-red-500'
                            }`}>
                                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            </div>
                        </div>

                        <div className="text-white text-center sm:text-left flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-1">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate max-w-full">{profile.fullName}</h1>
                                <Badge className={`${getAvailabilityBadge()} font-medium text-xs flex-shrink-0`}>
                                    {profile.availability}
                                </Badge>
                            </div>
                            <p className="text-white/80 flex items-center justify-center sm:justify-start gap-2 text-sm">
                                <Briefcase className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{profile.role} • {profile.department}</span>
                            </p>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-white/70">
                                <span className="flex items-center gap-1.5 hover:text-white transition-colors truncate max-w-full">
                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{profile.email}</span>
                                </span>
                                {profile.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                        {profile.phone}
                                    </span>
                                )}
                                {profile.location && (
                                    <span className="hidden sm:flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{profile.location}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white border-b border-slate-200 overflow-x-auto">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 min-w-0">
                    <div className="group relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-200/80 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Exp</span>
                            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{profile.yearsOfExperience}<span className="text-xs sm:text-sm text-slate-400">y</span></p>
                    </div>
                    
                    <div className="group relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-200/80 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Work</span>
                            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{profile.currentWorkload}<span className="text-xs sm:text-sm text-slate-400">/{profile.maxCapacity}h</span></p>
                    </div>
                    
                    <div className="group relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-200/80 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Util</span>
                            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <p className={`text-lg sm:text-2xl font-bold ${utilizationPercentage > 90 ? 'text-red-600' : utilizationPercentage > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {Math.round(utilizationPercentage)}%
                            </p>
                            <div className="w-full sm:flex-1 h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full bg-gradient-to-r ${getUtilizationColor()} transition-all`} 
                                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="group relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-200/80 hover:shadow-md transition-all hidden sm:block">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Velocity</span>
                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-slate-900 flex items-baseline gap-1">
                            {profile.velocity} <span className="text-xs sm:text-sm text-slate-400 font-normal">SP</span>
                        </p>
                    </div>
                    
                    <div className="group relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-200/80 hover:shadow-md transition-all hidden sm:block">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Projects</span>
                            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-slate-900">{profile.allocatedProjects.length}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    {/* Mobile: Scrollable horizontal tabs with better touch targets */}
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 scrollbar-hide">
                        <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl p-1 sm:p-1.5 inline-flex min-w-max gap-1">
                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" />
                                <span>Overview</span>
                            </TabsTrigger>
                            <TabsTrigger value="skills" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <Award className="w-4 h-4" />
                                <span>Skills</span>
                            </TabsTrigger>
                            <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <Target className="w-4 h-4" />
                                <span>Projects</span>
                            </TabsTrigger>
                            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>Attendance</span>
                            </TabsTrigger>
                            <TabsTrigger value="leave" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4" />
                                <span>Leave</span>
                            </TabsTrigger>
                            <TabsTrigger value="finance" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <Wallet className="w-4 h-4" />
                                <span>Finance</span>
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <Activity className="w-4 h-4" />
                                <span>Activity</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="mt-4 sm:mt-6">
                        <TabsContent value="overview">
                            <ProfileOverview profile={profile} isEditing={isEditing} onUpdate={setProfile} />
                        </TabsContent>

                        <TabsContent value="skills">
                            <SkillsExperience profile={profile} isEditing={isEditing} onUpdate={setProfile} />
                        </TabsContent>

                        <TabsContent value="projects">
                            <AllocatedProjects profile={profile} />
                        </TabsContent>

                        <TabsContent value="attendance">
                            <AttendanceTab />
                        </TabsContent>

                        <TabsContent value="leave">
                            <LeaveTab />
                        </TabsContent>

                        <TabsContent value="finance">
                            <FinanceTab employeeId={profile.id} />
                        </TabsContent>

                        <TabsContent value="activity">
                            <ActivityHistory employeeId={profile.id} activities={activities} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
