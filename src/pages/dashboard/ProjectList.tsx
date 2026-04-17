
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { projectApi, integrationsApi, GitlabProject } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Calendar, Users, FolderKanban, Clock, TrendingUp, ChevronRight, Sparkles, Target, AlertCircle, CheckCircle2, PauseCircle, Trash2, MoreVertical, Pencil, GitBranch, ExternalLink, RefreshCw, Star, GitFork } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate: string;
    endDate?: string;
    priority: string;
    teams?: any[];
    gitlabProjectId?: number | null;
    gitlabProjectPath?: string | null;
    gitlabWebUrl?: string | null;
}

export default function ProjectList() {
    const { organisation } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [gitlabProjects, setGitlabProjects] = useState<GitlabProject[]>([]);
    const [gitlabSource, setGitlabSource] = useState<'live' | 'fallback' | null>(null);
    const [gitlabLoading, setGitlabLoading] = useState(true);

    useEffect(() => {
        loadProjects();
        loadGitlabProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await projectApi.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGitlabProjects = async () => {
        setGitlabLoading(true);
        try {
            const { projects: gl, source } = await integrationsApi.getGitlabProjects();
            setGitlabProjects(gl);
            setGitlabSource(source);
        } catch (err) {
            console.error('Error loading GitLab projects:', err);
            setGitlabProjects([]);
        } finally {
            setGitlabLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        setDeleting(true);
        try {
            await projectApi.delete(projectToDelete.id);
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = useMemo(() => {
        return projects.filter(proj => {
            const matchesSearch = proj.name.toLowerCase().includes(search.toLowerCase()) ||
                proj.description?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || proj.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || proj.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [projects, search, statusFilter, priorityFilter]);

    const stats = useMemo(() => ({
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        critical: projects.filter(p => p.priority === 'critical' || p.priority === 'high').length,
    }), [projects]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active': return { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
            case 'completed': return { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
            case 'on-hold': return { icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
            case 'cancelled': return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
            default: return { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
        }
    };

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'critical': return { color: 'text-rose-700', bg: 'bg-rose-100', ring: 'ring-rose-200' };
            case 'high': return { color: 'text-orange-700', bg: 'bg-orange-100', ring: 'ring-orange-200' };
            case 'medium': return { color: 'text-blue-700', bg: 'bg-blue-100', ring: 'ring-blue-200' };
            default: return { color: 'text-slate-600', bg: 'bg-slate-100', ring: 'ring-slate-200' };
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900 px-4 sm:px-8 py-6 sm:py-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                <div className="max-w-7xl mx-auto relative">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div>
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="p-2 sm:p-2.5 bg-violet-500/20 backdrop-blur-sm rounded-lg sm:rounded-xl border border-violet-400/20">
                                    <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                                </div>
                                <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 backdrop-blur-sm text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" /> Project Hub
                                </Badge>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Projects</h1>
                            <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base max-w-lg">
                                Track progress, manage allocations, and deliver excellence
                            </p>
                        </div>
                        <Link to="/dashboard/projects/create" className="self-start">
                            <Button className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5 text-sm sm:text-base">
                                <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> New Project
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-violet-500/20 rounded-lg">
                                    <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Total Projects</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg">
                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.active}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Active Now</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.completed}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Completed</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-rose-500/20 rounded-lg">
                                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.critical}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">High Priority</p>
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
                                placeholder="Search projects..."
                                className="pl-9 sm:pl-11 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-lg sm:rounded-xl text-sm sm:text-base"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="flex-1 sm:w-[140px] h-10 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="on-hold">On Hold</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="flex-1 sm:w-[140px] h-10 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-sm">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priority</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* GitLab Projects Panel */}
                <div className="mb-6 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-rose-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/15 rounded-lg">
                                <GitBranch className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">GitLab Projects</h3>
                                <p className="text-xs text-slate-500">
                                    {gitlabSource === 'live' ? 'Synced from your GitLab instance' : 'Demo fallback · configure GITLAB_TOKEN to go live'}
                                    {' · '}{gitlabProjects.length} repos
                                </p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={loadGitlabProjects} disabled={gitlabLoading} className="gap-1.5">
                            <RefreshCw className={`w-3.5 h-3.5 ${gitlabLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>
                    <div className="p-3 sm:p-4">
                        {gitlabLoading ? (
                            <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Fetching from GitLab…
                            </div>
                        ) : gitlabProjects.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500">No GitLab projects available.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {gitlabProjects.map(p => (
                                    <a
                                        key={p.id}
                                        href={p.web_url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="group block p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all bg-white"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0">
                                                    <GitBranch className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate">{p.path_with_namespace}</p>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 flex-shrink-0" />
                                        </div>
                                        {p.description && (
                                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">{p.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3" />{p.star_count ?? 0}</span>
                                            <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{p.forks_count ?? 0}</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{p.open_issues_count ?? 0}</span>
                                            {p.default_branch && (
                                                <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal">{p.default_branch}</Badge>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <p className="text-xs sm:text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {projects.length} projects
                    </p>
                </div>

                {/* Project Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {loading ? (
                        <div className="col-span-full flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                <p className="text-slate-500">Loading projects...</p>
                            </div>
                        </div>
                    ) : filtered.map(proj => {
                        const statusConfig = getStatusConfig(proj.status);
                        const priorityConfig = getPriorityConfig(proj.priority);
                        const StatusIcon = statusConfig.icon;
                        const memberCount = proj.teams?.reduce((acc, team) => acc + (team.members?.length || 0), 0) || 0;

                        return (
                            <Card
                                key={proj.id}
                                className="group bg-white hover:shadow-xl transition-all duration-300 border-slate-200/60 hover:border-violet-300 rounded-2xl overflow-hidden"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/dashboard/allocation`)}>
                                            <div className={`p-2.5 rounded-xl ${statusConfig.bg} ${statusConfig.border} border`}>
                                                <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors truncate">
                                                    {proj.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="text-xs text-slate-500 capitalize">{proj.status}</p>
                                                    {proj.gitlabWebUrl && (
                                                        <a
                                                            href={proj.gitlabWebUrl}
                                                            target="_blank"
                                                            rel="noreferrer noopener"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                                                            title={proj.gitlabProjectPath ?? 'GitLab project'}
                                                        >
                                                            <GitBranch className="w-3 h-3" /> GitLab
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/allocation`)}>
                                                    <ChevronRight className="w-4 h-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/projects/edit/${proj.id}`)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit Project
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setProjectToDelete(proj);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Project
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-[40px]">
                                        {proj.description || 'No description provided'}
                                    </p>

                                    <div className="flex items-center gap-2 mb-4">
                                        <Badge className={`${priorityConfig.bg} ${priorityConfig.color} border-0 font-semibold text-xs`}>
                                            {proj.priority}
                                        </Badge>
                                        {memberCount > 0 && (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                <Users className="w-3 h-3 mr-1" />
                                                {memberCount} members
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{new Date(proj.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        {proj.endDate && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>Due {new Date(proj.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filtered.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FolderKanban className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No projects found</h3>
                        <p className="text-slate-500 mb-4">Try adjusting your search or filters</p>
                        <Link to="/dashboard/projects/create">
                            <Button className="bg-violet-600 hover:bg-violet-500">
                                <Plus className="mr-2 h-4 w-4" /> Create First Project
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Delete Project
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{projectToDelete?.name}</strong>?
                            This action cannot be undone and will remove all associated teams and allocations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProject}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? 'Deleting...' : 'Delete Project'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
