import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { employeeApi, projectApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import TeamCalendar from '@/components/dashboard/TeamCalendar';
import { 
    Users, FolderKanban, TrendingUp, Target, ArrowUpRight, ArrowDownRight, 
    Filter, Download, MoreHorizontal, Calendar, Code, Server, Palette, 
    Shield, TestTube, Database, Cloud, Smartphone, Settings, BarChart3
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
    availability: string;
    currentWorkload: number;
    skills?: { skillName: string; proficiency: string }[];
}

interface Project {
    id: string;
    name: string;
    status: string;
    priority: string;
}

const CHART_COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    orange: '#f97316',
    teal: '#14b8a6'
};

const ROLE_ICONS: Record<string, React.ElementType> = {
    'Frontend Developer': Code,
    'Backend Developer': Server,
    'Full Stack Developer': Code,
    'UI/UX Designer': Palette,
    'DevOps Engineer': Cloud,
    'QA Engineer': TestTube,
    'Security Engineer': Shield,
    'Data Engineer': Database,
    'Mobile Developer': Smartphone,
    'Tech Lead': Settings,
    'default': Code
};

export default function Overview() {
    const { organisation } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'partially-available' | 'unavailable'>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on-hold' | 'completed' | 'cancelled'>('all');
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [empData, projData] = await Promise.all([
                employeeApi.getAll(),
                projectApi.getAll()
            ]);
            setEmployees(empData);
            setProjects(projData as any);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = useMemo(() => {
        const roles = new Set<string>();
        employees.forEach(emp => roles.add(emp.designation || 'Unknown'));
        return ['all', ...Array.from(roles)];
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesAvailability = availabilityFilter === 'all' || emp.availability === availabilityFilter;
            const matchesRole = roleFilter === 'all' || (emp.designation || 'Unknown') === roleFilter;
            return matchesAvailability && matchesRole;
        });
    }, [employees, availabilityFilter, roleFilter]);

    const filteredProjects = useMemo(() => {
        if (statusFilter === 'all') return projects as any[];
        return projects.filter(p => p.status === statusFilter) as any[];
    }, [projects, statusFilter]);

    const dateLabel = useMemo(() => {
        if (dateRange === 'weekly') return 'This Week';
        if (dateRange === 'yearly') return 'Year to Date';
        return 'This Month';
    }, [dateRange]);

    const handleExport = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Timeframe', dateLabel],
            ['Total Employees (filtered)', totalEmployees],
            ['Available Employees', availableEmployees],
            ['Active Projects', activeProjects],
            ['Total Projects (filtered)', totalProjects],
            ['Utilization %', `${avgUtilization}%`],
        ];

        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `allocatex-dashboard-${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const totalEmployees = filteredEmployees.length;
    const activeProjects = filteredProjects.filter(p => p.status === 'active').length;
    const totalProjects = filteredProjects.length;
    const availableEmployees = filteredEmployees.filter(e => e.availability === 'available').length;
    const partiallyAvailable = filteredEmployees.filter(e => e.availability === 'partially-available').length;
    const unavailableEmployees = filteredEmployees.filter(e => e.availability === 'unavailable').length;
    const avgUtilization = filteredEmployees.length > 0
        ? Math.round(filteredEmployees.reduce((sum, e) => sum + e.currentWorkload, 0) / filteredEmployees.length)
        : 0;

    const roleDistribution = useMemo(() => {
        const distribution = filteredEmployees.reduce((acc: Record<string, number>, emp) => {
            const role = emp.designation || 'Unknown';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(distribution)
            .map(([name, value], index) => ({
                name,
                value,
                color: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredEmployees]);

    const skillDistribution = useMemo(() => {
        const skills: Record<string, number> = {};
        filteredEmployees.forEach(emp => {
            (emp.skills || []).forEach(skill => {
                const skillName = skill.skillName || '';
                if (skillName) {
                    skills[skillName] = (skills[skillName] || 0) + 1;
                }
            });
        });
        return Object.entries(skills)
            .map(([name, value], index) => ({
                name,
                value,
                color: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [filteredEmployees]);

    const projectStatusData = [
        { name: 'Active', value: filteredProjects.filter(p => p.status === 'active').length, color: CHART_COLORS.success },
        { name: 'On Hold', value: filteredProjects.filter(p => p.status === 'on-hold').length, color: CHART_COLORS.warning },
        { name: 'Completed', value: filteredProjects.filter(p => p.status === 'completed').length, color: CHART_COLORS.primary },
        { name: 'Cancelled', value: filteredProjects.filter(p => p.status === 'cancelled').length, color: CHART_COLORS.danger }
    ].filter(d => d.value > 0);

    const availabilityData = [
        { name: 'Available', value: availableEmployees, color: CHART_COLORS.success },
        { name: 'Partial', value: partiallyAvailable, color: CHART_COLORS.warning },
        { name: 'Busy', value: unavailableEmployees, color: CHART_COLORS.danger }
    ].filter(d => d.value > 0);

    const roleDetails = useMemo(() => {
        const employeeMap = new Map(filteredEmployees.map(emp => [emp.id, emp]));
        const seen = new Set<string>();
        const roles: Record<string, { role: string; members: Array<{ id: string; name: string; projectName: string; teamName: string; designation?: string; availability: string; skills: { skillName: string; proficiency: string }[] }> }> = {};

        (filteredProjects as any[]).forEach((project) => {
            const teams = (project?.teams ?? []) as any[];
            teams.forEach((team) => {
                (team.members ?? []).forEach((member: any) => {
                    const employeeId = member.employeeId || member.id;
                    const employee = employeeMap.get(employeeId);
                    if (!employee) return; // respect current filters

                    const roleName = member.role || employee.designation || 'Contributor';
                    const bucket = roles[roleName] ?? { role: roleName, members: [] };
                    roles[roleName] = bucket;

                    bucket.members.push({
                        id: employeeId,
                        name: `${employee.firstName} ${employee.lastName}`.trim() || member.name || 'Unknown',
                        projectName: project.name || '—',
                        teamName: team.name || '—',
                        designation: employee.designation || member.role,
                        availability: employee.availability,
                        skills: (employee.skills ?? []).slice(0, 4),
                    });
                    seen.add(employeeId);
                });
            });
        });

        filteredEmployees.forEach((emp) => {
            if (seen.has(emp.id)) return;
            const roleName = emp.designation || 'Unassigned';
            const bucket = roles[roleName] ?? { role: roleName, members: [] };
            roles[roleName] = bucket;

            bucket.members.push({
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`.trim() || emp.id,
                projectName: 'Unassigned',
                teamName: '-',
                designation: emp.designation,
                availability: emp.availability,
                skills: (emp.skills ?? []).slice(0, 4),
            });
        });

        return Object.values(roles).sort((a, b) => b.members.length - a.members.length);
    }, [filteredEmployees, filteredProjects]);

    // Team Activity Data - Tracks total hours logged by all team members per day
    // This helps managers identify peak productivity days and staffing patterns
    const weeklyTrend = [
        { day: 'Sun', hours: 120, tasks: 45 },
        { day: 'Mon', hours: 320, tasks: 128 },
        { day: 'Tue', hours: 387, tasks: 156 },
        { day: 'Wed', hours: 345, tasks: 142 },
        { day: 'Thu', hours: 298, tasks: 118 },
        { day: 'Fri', hours: 340, tasks: 135 },
        { day: 'Sat', hours: 95, tasks: 38 }
    ];
    
    const totalWeeklyHours = weeklyTrend.reduce((sum, d) => sum + d.hours, 0);
    const totalWeeklyTasks = weeklyTrend.reduce((sum, d) => sum + d.tasks, 0);

    const monthlyOverview = [
        { month: 'Oct', engineering: 2400, design: 1200, qa: 800, devops: 600 },
        { month: 'Nov', engineering: 2800, design: 1400, qa: 900, devops: 700 },
        { month: 'Dec', engineering: 3200, design: 1600, qa: 1100, devops: 850 }
    ];

    const isWeekly = dateRange === 'weekly';

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50/50 p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Resource analytics for {organisation?.name || 'AllocateX'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>{dateLabel}</span>
                        </div>
                        <Select value={dateRange} onValueChange={(value) => setDateRange(value as 'weekly' | 'monthly' | 'yearly')}>
                            <SelectTrigger className="w-[120px] bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="w-4 h-4" />
                                    Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 space-y-3" align="end">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-700">Availability</p>
                                    <Select value={availabilityFilter} onValueChange={(value) => setAvailabilityFilter(value as any)}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="partially-available">Partial</SelectItem>
                                            <SelectItem value="unavailable">Busy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-700">Role</p>
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {roleOptions.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role === 'all' ? 'All Roles' : role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-700">Project Status</p>
                                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="on-hold">On Hold</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />12.5%
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-slate-500">Total Employees</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{totalEmployees.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 mt-1">{availableEmployees} available now</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-violet-50 rounded-xl">
                                    <FolderKanban className="w-5 h-5 text-violet-600" />
                                </div>
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                                    <ArrowDownRight className="w-3 h-3 mr-1" />3.2%
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-slate-500">Active Projects</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{activeProjects}</p>
                                <p className="text-xs text-slate-400 mt-1">{totalProjects} total projects</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-emerald-50 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />8.1%
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-slate-500">Utilization Rate</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{avgUtilization}%</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {avgUtilization >= 80 ? 'Optimal capacity' : avgUtilization >= 60 ? 'Good capacity' : 'Under capacity'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-amber-50 rounded-xl">
                                    <Target className="w-5 h-5 text-amber-600" />
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />5.4%
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-slate-500">Avg Velocity</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">95%</p>
                                <p className="text-xs text-slate-400 mt-1">Last 5 sprints avg</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                                        Workload Overview
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                                            {isWeekly ? 'By Day' : 'By Department'}
                                        </Badge>
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {isWeekly 
                                            ? 'Total work hours logged by your team across each day of the week'
                                            : 'Monthly work hours breakdown by department (stacked view)'
                                        }
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {filteredEmployees.reduce((s, e) => s + e.currentWorkload, 0).toLocaleString()} hrs
                                        <span className="text-sm font-normal text-emerald-600 ml-2">+143 vs last period</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="text-xs">
                                        <Filter className="w-3 h-3 mr-1" />Filter
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {/* Axis Labels */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-2 px-1">
                                <span>{isWeekly ? 'Day of Week' : 'Month'}</span>
                                <span>{isWeekly ? 'Hours Logged' : 'Hours by Department'}</span>
                            </div>
                            {isWeekly ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={weeklyTrend} barGap={6}>
                                        <XAxis 
                                            dataKey="day" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                            tickFormatter={(v) => `${v}h`}
                                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                            formatter={(value: number, name: string) => {
                                                if (name === 'hours') return [`${value} hours`, 'Work Hours Logged'];
                                                return [value, name];
                                            }}
                                            labelFormatter={(label) => `${label} - Team Activity`}
                                        />
                                        <Bar dataKey="hours" fill="url(#workloadGradient)" radius={[6, 6, 0, 0]} name="hours" />
                                        <defs>
                                            <linearGradient id="workloadGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#a5b4fc" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={monthlyOverview} barGap={4}>
                                            <XAxis 
                                                dataKey="month" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                tickFormatter={(v) => `${v}h`}
                                                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number, name: string) => [`${value} hours`, name.charAt(0).toUpperCase() + name.slice(1)]}
                                            />
                                            <Bar dataKey="engineering" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} name="Engineering" />
                                            <Bar dataKey="design" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} name="Design" />
                                            <Bar dataKey="qa" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} name="QA" />
                                            <Bar dataKey="devops" stackId="a" fill="#c4b5fd" radius={[4, 4, 0, 0]} name="DevOps" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="flex items-center justify-center gap-6 mt-4 text-xs border-t border-slate-100 pt-4">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-slate-600 font-medium">Engineering</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500" /><span className="text-slate-600 font-medium">Design</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-400" /><span className="text-slate-600 font-medium">QA</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-300" /><span className="text-slate-600 font-medium">DevOps</span></div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 text-center mt-2">
                                        💡 Stacked bars show cumulative hours per department. Hover for details.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        Team Activity
                                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Hours Logged</span>
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-1">Track daily work hours logged by your team this week</p>
                                </div>
                                <Select defaultValue="weekly">
                                    <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="mt-3 flex items-baseline gap-4">
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{totalWeeklyHours.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Total hours this week</p>
                                </div>
                                <div className="pl-4 border-l border-slate-200">
                                    <p className="text-lg font-semibold text-slate-700">{totalWeeklyTasks}</p>
                                    <p className="text-xs text-slate-500">Tasks completed</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                                <span>Day of Week</span>
                                <span>Hours Logged</span>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={weeklyTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                        label={{ value: '', position: 'bottom', fontSize: 10, fill: '#94a3b8' }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickFormatter={(value) => `${value}h`}
                                        width={35}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                                        formatter={(value: number, name: string) => {
                                            if (name === 'hours') return [`${value} hours`, 'Hours Logged'];
                                            if (name === 'tasks') return [`${value} tasks`, 'Tasks Completed'];
                                            return [value, name];
                                        }}
                                        labelFormatter={(label) => `${label}`}
                                    />
                                    <Bar 
                                        dataKey="hours" 
                                        fill="url(#teamActivityGradient)" 
                                        radius={[6, 6, 0, 0]}
                                        name="hours"
                                    />
                                    <defs>
                                        <linearGradient id="teamActivityGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#c4b5fd" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="w-3 h-3 rounded bg-gradient-to-b from-violet-500 to-violet-300" />
                                        <span>Hours logged per day</span>
                                    </div>
                                    <span className="text-slate-400">
                                        Avg: {Math.round(totalWeeklyHours / 7)}h/day
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />Team by Role
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {roleDistribution.slice(0, 6).map((role) => {
                                    const Icon = ROLE_ICONS[role.name] || ROLE_ICONS.default;
                                    const percentage = totalEmployees ? Math.round((role.value / totalEmployees) * 100) : 0;
                                    return (
                                        <div key={role.name} className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${role.color}15` }}>
                                                <Icon className="w-4 h-4" style={{ color: role.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-slate-700 truncate">{role.name}</span>
                                                    <span className="text-sm font-bold text-slate-900">{role.value}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: role.color }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {roleDistribution.length > 6 && (
                                <Button variant="ghost" className="w-full mt-4 text-xs text-slate-500" onClick={() => setRoleDialogOpen(true)}>
                                    View all {roleDistribution.length} roles
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Code className="w-4 h-4 text-slate-400" />Skills Distribution
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {skillDistribution.length > 0 ? (
                                <div className="space-y-2.5">
                                    {skillDistribution.slice(0, 8).map((skill) => (
                                        <div key={skill.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: skill.color }} />
                                                <span className="text-sm text-slate-600">{skill.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${totalEmployees ? Math.min((skill.value / totalEmployees) * 100, 100) : 0}%`, backgroundColor: skill.color }} />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900 w-6 text-right">{skill.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-sm text-slate-400">No skills data available</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4 text-slate-400" />Project Status
                                </CardTitle>
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                                    <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on-hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <ResponsiveContainer width={140} height={140}>
                                        <PieChart>
                                            <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                                                {projectStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-slate-900">{totalProjects}</p>
                                            <p className="text-[10px] text-slate-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {projectStatusData.map((status) => (
                                        <div key={status.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                                                <span className="text-sm text-slate-600">{status.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900">{status.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">Employee Availability</CardTitle>
                                <Button variant="link" className="text-xs text-indigo-600 p-0 h-auto">See All</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <ResponsiveContainer width={160} height={160}>
                                    <PieChart>
                                        <Pie data={availabilityData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                                            {availabilityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-4">
                                    {availabilityData.map((item) => (
                                        <div key={item.name} className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                                    <span className="text-lg font-bold text-slate-900">{item.value}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">{totalEmployees ? Math.round((item.value / totalEmployees) * 100) : 0}% of team</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
                                <Button variant="link" className="text-xs text-indigo-600 p-0 h-auto">+ View All</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {filteredEmployees.slice(0, 5).map((emp) => (
                                    <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`} />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(emp.currentWorkload * 2.5, 100)}%` }} />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600">{emp.currentWorkload}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-0 text-white">
                    <CardContent className="py-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 text-center">
                            <div><p className="text-2xl lg:text-3xl font-bold">95%</p><p className="text-xs text-slate-400 mt-1">On-Time Delivery</p></div>
                            <div><p className="text-2xl lg:text-3xl font-bold">88</p><p className="text-xs text-slate-400 mt-1">Quality Score</p></div>
                            <div><p className="text-2xl lg:text-3xl font-bold">3.2d</p><p className="text-xs text-slate-400 mt-1">Avg Task Time</p></div>
                            <div><p className="text-2xl lg:text-3xl font-bold">42</p><p className="text-xs text-slate-400 mt-1">Tasks This Week</p></div>
                            <div><p className="text-2xl lg:text-3xl font-bold">7.8</p><p className="text-xs text-slate-400 mt-1">Velocity (SP)</p></div>
                            <div><p className="text-2xl lg:text-3xl font-bold">92%</p><p className="text-xs text-slate-400 mt-1">Satisfaction</p></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Leave Calendar */}
                <TeamCalendar />

                <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                    <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">Team by Role • Detailed View</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                See every contributor with their project, team, and current availability.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] mt-2">
                            <div className="grid grid-cols-[1.6fr,1fr,1fr,1fr,1fr,1.2fr] text-xs font-semibold text-slate-500 px-2 pb-2">
                                <span>Name</span>
                                <span>Project</span>
                                <span>Team</span>
                                <span>Role</span>
                                <span>Availability</span>
                                <span>Skills</span>
                            </div>
                            <div className="divide-y divide-slate-200">
                                {roleDetails.flatMap((detail) =>
                                    detail.members.map((member) => {
                                        const availabilityColor = member.availability === 'available'
                                            ? 'bg-emerald-500'
                                            : member.availability === 'partially-available'
                                                ? 'bg-amber-500'
                                                : member.availability === 'unavailable'
                                                    ? 'bg-rose-500'
                                                    : 'bg-slate-400';

                                        return (
                                            <div
                                                key={`${detail.role}-${member.id}-${member.projectName}`}
                                                className="grid grid-cols-[1.6fr,1fr,1fr,1fr,1fr,1.2fr] items-center gap-3 px-2 py-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-700 text-xs">
                                                            {member.name?.charAt(0) ?? '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{detail.role}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm text-slate-700 truncate">{member.projectName}</span>
                                                <span className="text-sm text-slate-600 truncate">{member.teamName}</span>
                                                <span className="text-sm text-slate-600 truncate">{member.designation || detail.role}</span>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <span className={`h-2 w-2 rounded-full ${availabilityColor}`} />
                                                    <span className="capitalize truncate">{member.availability?.replace(/-/g, ' ') || 'n/a'}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
                                                    {member.skills.length ? member.skills.map((skill, idx) => (
                                                        <span key={`${skill.skillName}-${idx}`} className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                            {skill.skillName}
                                                        </span>
                                                    )) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
