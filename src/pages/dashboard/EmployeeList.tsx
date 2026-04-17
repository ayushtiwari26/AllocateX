import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { employeeApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Users, Briefcase, TrendingUp, ChevronRight, Sparkles, Grid3X3, List, SlidersHorizontal, Crown, Star, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AllocatedProject {
    id: string;
    name: string;
    status?: string;
    priority?: string;
    teamName?: string;
    role?: string;
    allocationPercentage?: number;
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
    department: string;
    availability: string;
    currentWorkload: number;
    skills?: any[];
    teamMemberships?: Array<{
        id: string;
        role: string;
        allocationPercentage: number;
        team?: {
            id: string;
            name: string;
            project?: { id: string; name: string; status?: string; priority?: string };
        };
    }>;
}

// Role tiers — higher tier = more senior / more important in org hierarchy.
// Tech Consultant sits at the very top, then Tech Lead, Senior roles, SDE-II, SDE-I, etc.
const ROLE_TIERS: Array<{ label: string; icon: any; accent: string; match: (t: string) => boolean; rank: number }> = [
    { label: 'Tech Consultant', icon: Crown, accent: 'from-amber-500 to-yellow-600', rank: 100, match: t => /tech consultant|consultant/i.test(t) },
    { label: 'Tech Leads', icon: Crown, accent: 'from-violet-500 to-fuchsia-600', rank: 90, match: t => /tech lead|team lead/i.test(t) },
    { label: 'Senior Engineers', icon: Star, accent: 'from-indigo-500 to-blue-600', rank: 80, match: t => /senior|sde\s*[-\s]?(ii|2)|software development engineer\s*-?\s*ii|software development engineer\s*-?\s*2/i.test(t) },
    { label: 'SDE I / Engineers', icon: Briefcase, accent: 'from-sky-500 to-cyan-600', rank: 70, match: t => /sde\s*[-\s]?(i|1)\b|software development engineer\s*-?\s*i\b|software development engineer\s*-?\s*1\b|software development engineer$|front-?end developer|devops engineer/i.test(t) },
    { label: 'Business Analysts', icon: TrendingUp, accent: 'from-emerald-500 to-teal-600', rank: 60, match: t => /business analyst/i.test(t) },
    { label: 'Quality Engineering', icon: Briefcase, accent: 'from-rose-500 to-pink-600', rank: 55, match: t => /qa|test engineer/i.test(t) },
    { label: 'Design', icon: Sparkles, accent: 'from-pink-500 to-rose-600', rank: 50, match: t => /ui|ux|designer/i.test(t) },
    { label: 'Support', icon: Users, accent: 'from-slate-500 to-slate-700', rank: 30, match: t => /support|ticketing/i.test(t) },
    { label: 'Other', icon: Users, accent: 'from-slate-400 to-slate-500', rank: 0, match: () => true },
];

const tierFor = (designation: string) => ROLE_TIERS.find(t => t.match(designation)) ?? ROLE_TIERS[ROLE_TIERS.length - 1];
const rankFor = (designation: string) => tierFor(designation).rank;

const flattenProjects = (emp: Employee): AllocatedProject[] => {
    if (!emp.teamMemberships?.length) return [];
    const byProject = new Map<string, AllocatedProject>();
    for (const tm of emp.teamMemberships) {
        const p = tm.team?.project;
        if (!p) continue;
        const existing = byProject.get(p.id);
        if (existing) {
            existing.allocationPercentage = (existing.allocationPercentage ?? 0) + (tm.allocationPercentage ?? 0);
        } else {
            byProject.set(p.id, {
                id: p.id,
                name: p.name,
                status: p.status,
                priority: p.priority,
                teamName: tm.team?.name,
                role: tm.role,
                allocationPercentage: tm.allocationPercentage,
            });
        }
    }
    return Array.from(byProject.values());
};

export default function EmployeeList() {
    const { organisation } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await employeeApi.getAll();
            setEmployees(data);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const filtered = employees.filter(e => {
        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
        const searchLower = search.toLowerCase();
        const matchesSearch = fullName.includes(searchLower) ||
            e.designation.toLowerCase().includes(searchLower) ||
            e.department.toLowerCase().includes(searchLower);
        const matchesDepartment = departmentFilter === 'all' || e.department === departmentFilter;
        const matchesAvailability = availabilityFilter === 'all' || e.availability === availabilityFilter;
        return matchesSearch && matchesDepartment && matchesAvailability;
    });

    // Group employees by role tier (Tech Consultant first, then rank descending).
    const grouped = useMemo(() => {
        const buckets = new Map<string, { label: string; icon: any; accent: string; rank: number; items: Employee[] }>();
        for (const emp of filtered) {
            const tier = tierFor(emp.designation || '');
            if (!buckets.has(tier.label)) {
                buckets.set(tier.label, { label: tier.label, icon: tier.icon, accent: tier.accent, rank: tier.rank, items: [] });
            }
            buckets.get(tier.label)!.items.push(emp);
        }
        for (const b of buckets.values()) {
            b.items.sort((a, b2) => {
                // Within a tier, higher workload first (more loaded), then alphabetically.
                if (b2.currentWorkload !== a.currentWorkload) return b2.currentWorkload - a.currentWorkload;
                return a.firstName.localeCompare(b2.firstName);
            });
        }
        return Array.from(buckets.values()).sort((a, b) => b.rank - a.rank);
    }, [filtered]);

    const stats = {
        total: employees.length,
        available: employees.filter(e => e.availability === 'available').length,
        partial: employees.filter(e => e.availability === 'partially-available').length,
        avgWorkload: employees.length > 0 ? Math.round(employees.reduce((sum, e) => sum + e.currentWorkload, 0) / employees.length) : 0
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 sm:px-8 py-6 sm:py-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                <div className="max-w-7xl mx-auto relative">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div>
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="p-2 sm:p-2.5 bg-indigo-500/20 backdrop-blur-sm rounded-lg sm:rounded-xl border border-indigo-400/20">
                                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                                </div>
                                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 backdrop-blur-sm text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" /> Team Directory
                                </Badge>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Employees</h1>
                            <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base max-w-lg">
                                View detailed profiles and track availability
                            </p>
                        </div>
                        <Link to="/onboarding/add-members" className="self-start">
                            <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-sm sm:text-base">
                                <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> Add Member
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Total Members</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg">
                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.available}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Available Now</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg">
                                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.partial}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Partially Available</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-violet-500/20 rounded-lg">
                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.avgWorkload}%</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Avg Workload</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, role, or skill..."
                                className="pl-9 sm:pl-11 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-lg sm:rounded-xl text-sm sm:text-base"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="flex-1 sm:w-[160px] h-10 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-sm">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                <SelectTrigger className="flex-1 sm:w-[160px] h-10 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-sm">
                                    <SelectValue placeholder="Availability" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="partially-available">Partial</SelectItem>
                                    <SelectItem value="unavailable">Busy</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={`rounded-lg h-9 w-9 p-0 ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={`rounded-lg h-9 w-9 p-0 ${viewMode === 'list' ? 'shadow-sm' : ''}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-5">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {employees.length} members
                    </p>
                </div>

                {/* Employee Grid grouped by Role Tier */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-slate-500">Loading team members...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {grouped.map(group => {
                            const GroupIcon = group.icon;
                            return (
                                <section key={group.label}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-xl bg-gradient-to-br ${group.accent} text-white shadow-sm`}>
                                            <GroupIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">{group.label}</h2>
                                            <p className="text-xs text-slate-500">{group.items.length} member{group.items.length === 1 ? '' : 's'}</p>
                                        </div>
                                        <div className="flex-1 border-t border-dashed border-slate-200 ml-3" />
                                    </div>

                                    <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                        {group.items.map(emp => {
                                            const projects = flattenProjects(emp);
                                            return (
                                                <Card
                                                    key={emp.id}
                                                    className={`group bg-white hover:shadow-xl transition-all duration-300 cursor-pointer border-slate-200/60 hover:border-indigo-300 rounded-2xl overflow-hidden ${viewMode === 'list' ? 'hover:bg-slate-50' : ''}`}
                                                    onClick={() => navigate(`/dashboard/employees/${emp.id}`)}
                                                >
                                                    <CardContent className={`${viewMode === 'grid' ? 'p-6' : 'p-5'}`}>
                                                        {viewMode === 'grid' ? (
                                                            <>
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="relative">
                                                                            <div className={`h-14 w-14 rounded-2xl overflow-hidden bg-gradient-to-br ${group.accent} flex items-center justify-center shadow-lg`}>
                                                                                <span className="text-white font-bold text-lg">
                                                                                    {emp.firstName[0]}{emp.lastName[0] || ''}
                                                                                </span>
                                                                            </div>
                                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${emp.availability === 'available' ? 'bg-emerald-500' : emp.availability === 'partially-available' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                                {emp.firstName} {emp.lastName}
                                                                            </h3>
                                                                            <p className="text-sm text-slate-500">{emp.designation}</p>
                                                                        </div>
                                                                    </div>
                                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                                                </div>

                                                                {/* Allocated Projects */}
                                                                <div className="mb-3">
                                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                                        <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                                                            {projects.length ? `Allocated (${projects.length})` : 'No allocations'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {projects.slice(0, 3).map(p => (
                                                                            <span key={p.id} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100" title={`${p.name} · ${p.role ?? ''} · ${p.allocationPercentage ?? 0}%`}>
                                                                                {p.name.length > 24 ? p.name.slice(0, 22) + '…' : p.name}
                                                                            </span>
                                                                        ))}
                                                                        {projects.length > 3 && (
                                                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">+{projects.length - 3}</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {emp.skills && emp.skills.slice(0, 3).map((skill: any) => (
                                                                            <span key={skill.id} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                                                {skill.skillName}
                                                                            </span>
                                                                        ))}
                                                                        {emp.skills && emp.skills.length > 3 && (
                                                                            <span className="px-2.5 py-1 bg-indigo-50 rounded-lg text-xs font-medium text-indigo-600">
                                                                                +{emp.skills.length - 3}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="pt-3 border-t border-slate-100">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-medium text-slate-500">Load</span>
                                                                            <span className={`text-xs font-bold ${emp.currentWorkload < 60 ? 'text-emerald-600' : emp.currentWorkload < 85 ? 'text-amber-600' : 'text-rose-600'}`}>{emp.currentWorkload}%</span>
                                                                        </div>
                                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-500 ${emp.currentWorkload < 60 ? 'bg-emerald-500' :
                                                                                        emp.currentWorkload < 85 ? 'bg-amber-500' : 'bg-rose-500'
                                                                                    }`}
                                                                                style={{ width: `${Math.min(emp.currentWorkload, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        <p className="text-xs text-slate-400 mt-2">{emp.department}</p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                                    <div className="relative flex-shrink-0">
                                                                        <div className={`h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br ${group.accent} flex items-center justify-center`}>
                                                                            <span className="text-white font-bold">
                                                                                {emp.firstName[0]}{emp.lastName[0] || ''}
                                                                            </span>
                                                                        </div>
                                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${emp.availability === 'available' ? 'bg-emerald-500' : emp.availability === 'partially-available' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                                            {emp.firstName} {emp.lastName}
                                                                        </h3>
                                                                        <p className="text-sm text-slate-500 truncate">{emp.designation} • {emp.department}</p>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {projects.slice(0, 2).map(p => (
                                                                                <span key={p.id} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700">{p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name}</span>
                                                                            ))}
                                                                            {projects.length > 2 && <span className="text-[10px] text-slate-400">+{projects.length - 2}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                                    <div className="text-right min-w-[80px]">
                                                                        <p className={`text-sm font-bold ${emp.currentWorkload < 60 ? 'text-emerald-600' : emp.currentWorkload < 85 ? 'text-amber-600' : 'text-rose-600'}`}>{emp.currentWorkload}%</p>
                                                                        <p className="text-xs text-slate-400">Load</p>
                                                                    </div>
                                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No members found</h3>
                        <p className="text-slate-500">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
