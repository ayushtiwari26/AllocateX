import type { EmployeeProfile } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Calendar, Clock, CheckCircle2, Circle, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface AllocatedProjectsProps {
    profile: EmployeeProfile;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AllocatedProjects({ profile }: AllocatedProjectsProps) {
    // Debug logging
    console.log('[AllocatedProjects] Rendering for:', profile?.fullName);
    console.log('[AllocatedProjects] Allocated Projects:', profile?.allocatedProjects?.length || 0);

    if (!profile) {
        return <div className="text-center py-8 text-gray-500">Loading profile...</div>;
    }

    const allocatedProjects = profile.allocatedProjects || [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-100 text-green-700';
            case 'in-progress': return 'bg-blue-100 text-blue-700';
            case 'review': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case 'in-progress': return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
            case 'review': return <AlertCircle className="w-4 h-4 text-purple-600" />;
            default: return <Circle className="w-4 h-4 text-gray-400" />;
        }
    };

    // Calculate project distribution data for pie chart
    const projectDistributionData = allocatedProjects.map((project, idx) => ({
        name: project.projectName,
        value: project.allocationPercentage,
        hours: project.hoursAllocated
    }));

    // Task status distribution
    const allTasks = allocatedProjects.flatMap(p => p.currentSprintTasks || []);
    const taskStatusData = [
        { name: 'To Do', value: allTasks.filter(t => t.status === 'todo').length, color: '#9ca3af' },
        { name: 'In Progress', value: allTasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
        { name: 'Review', value: allTasks.filter(t => t.status === 'review').length, color: '#8b5cf6' },
        { name: 'Done', value: allTasks.filter(t => t.status === 'done').length, color: '#10b981' }
    ].filter(d => d.value > 0);

    // Project workload chart data
    const workloadData = allocatedProjects.map(p => ({
        project: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
        hours: p.hoursAllocated,
        allocation: p.allocationPercentage
    }));

    // Calculate totals
    const activeProjectsCount = allocatedProjects.filter(p => p.isActive).length;
    const totalHours = allocatedProjects.reduce((sum, p) => sum + (p.hoursAllocated || 0), 0);
    const totalSprintTasks = allTasks.length;
    const avgAllocation = allocatedProjects.length > 0
        ? Math.round(allocatedProjects.reduce((sum, p) => sum + (p.allocationPercentage || 0), 0) / allocatedProjects.length)
        : 0;

    console.log('[AllocatedProjects] Calculated:', {
        activeProjects: activeProjectsCount,
        totalHours,
        totalTasks: totalSprintTasks,
        avgAllocation
    });

    return (
        <div className="space-y-6">
            {/* Highlighted Summary with Charts */}
            <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 text-white shadow-xl">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        <div className="text-center">
                            <p className="text-indigo-100 text-xs sm:text-sm mb-1">Active Projects</p>
                            <p className="text-3xl sm:text-5xl font-bold">
                                {activeProjectsCount}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-indigo-100 text-sm mb-1">Total Hours/Week</p>
                            <p className="text-5xl font-bold">
                                {totalHours}h
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-indigo-100 text-sm mb-1">Sprint Tasks</p>
                            <p className="text-5xl font-bold">
                                {totalSprintTasks}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-indigo-100 text-sm mb-1">Avg Allocation</p>
                            <p className="text-5xl font-bold">
                                {avgAllocation}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            {profile.allocatedProjects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Project Distribution Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Project Allocation Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={projectDistributionData}
                                        cx="50%"
                                        cy="50%"
                                        label={(entry) => `${entry.value}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {projectDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 space-y-1">
                                {projectDistributionData.map((proj, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-gray-700">{proj.name}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{proj.value}% ({proj.hours}h)</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Task Status Distribution */}
                    {taskStatusData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Current Sprint Tasks Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={taskStatusData}
                                            cx="50%"
                                            cy="50%"
                                            label={(entry) => entry.name}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {taskStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {taskStatusData.map((status, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                                                <span className="text-gray-700">{status.name}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{status.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Workload Bar Chart */}
            {workloadData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Hours Allocated Per Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={workloadData}>
                                <XAxis dataKey="project" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="hours" fill="#6366f1" name="Hours/Week" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Projects List */}
            {allocatedProjects.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-gray-500">
                        <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>No projects allocated currently</p>
                    </CardContent>
                </Card>
            ) : (
                allocatedProjects.map((project, idx) => (
                    <Card key={idx} className={`${!project.isActive ? 'opacity-60' : 'border-l-4 border-l-indigo-500'}`}>
                        <CardHeader className="pb-3 sm:pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2 flex-wrap">
                                        <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
                                        <span className="truncate">{project.projectName}</span>
                                        {!project.isActive && (
                                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                                Inactive
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <p className="text-sm sm:text-base text-gray-600 mt-1">{project.roleInProject}</p>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{project.allocationPercentage}%</div>
                                    <div className="text-xs sm:text-sm text-gray-500">{project.hoursAllocated}h/week</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Timeline */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">Started:</span> {format(new Date(project.startDate), 'MMM dd, yyyy')}
                                </div>
                                {project.endDate && (
                                    <>
                                        <span>→</span>
                                        <span><span className="font-medium">Ends:</span> {format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                                    </>
                                )}
                            </div>

                            {/* Allocation Progress */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 font-medium">Allocation Level</span>
                                    <span className="font-bold text-gray-900">{project.allocationPercentage}%</span>
                                </div>
                                <Progress value={project.allocationPercentage} className="h-3" />
                            </div>

                            {/* Current Sprint Tasks */}
                            {project.currentSprintTasks.length > 0 && (
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                        Current Sprint Tasks ({project.currentSprintTasks.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {project.currentSprintTasks.map((task, taskIdx) => (
                                            <div key={taskIdx} className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                                        {getStatusIcon(task.status)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{task.title}</p>
                                                            {task.description && (
                                                                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                                                            {task.priority}
                                                        </Badge>
                                                        <Badge className={`${getStatusColor(task.status)} text-xs`}>
                                                            {task.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                                    <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{task.storyPoints} SP</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {task.estimatedHours}h estimated
                                                    </span>
                                                    {task.actualHours && (
                                                        <span className="text-green-600 font-medium">{task.actualHours}h actual</span>
                                                    )}
                                                    {task.dueDate && (
                                                        <span className="ml-auto flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Due: {format(new Date(task.dueDate), 'MMM dd')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Task Summary */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <div className="text-center bg-indigo-50 p-3 rounded-lg">
                                            <p className="text-xs text-indigo-700 font-medium">Total SP</p>
                                            <p className="text-2xl font-bold text-indigo-900">
                                                {project.currentSprintTasks.reduce((sum, t) => sum + t.storyPoints, 0)}
                                            </p>
                                        </div>
                                        <div className="text-center bg-green-50 p-3 rounded-lg">
                                            <p className="text-xs text-green-700 font-medium">Done</p>
                                            <p className="text-2xl font-bold text-green-900">
                                                {project.currentSprintTasks.filter(t => t.status === 'done').length}
                                            </p>
                                        </div>
                                        <div className="text-center bg-blue-50 p-3 rounded-lg">
                                            <p className="text-xs text-blue-700 font-medium">In Progress</p>
                                            <p className="text-2xl font-bold text-blue-900">
                                                {project.currentSprintTasks.filter(t => t.status === 'in-progress').length}
                                            </p>
                                        </div>
                                        <div className="text-center bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-700 font-medium">To Do</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {project.currentSprintTasks.filter(t => t.status === 'todo').length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
