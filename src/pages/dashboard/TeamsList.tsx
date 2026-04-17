/**
 * Squads & Teams listing page
 * Shows all teams (squads) grouped by project, with members, lead, and quick actions.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users, Crown, Search, RefreshCw, Loader2, ChevronRight,
    FolderKanban, UserPlus, Briefcase, Star,
} from 'lucide-react';
import { projectApi } from '@/services/api';

interface TeamMember {
    id: string;
    employeeId: string;
    role: string;
    allocationPercentage: number;
    isActive: boolean;
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        designation: string;
        department: string;
        email: string;
    };
}

interface Team {
    id: string;
    name: string;
    description?: string;
    leadId?: string;
    members?: TeamMember[];
    lead?: {
        id: string;
        firstName: string;
        lastName: string;
        designation: string;
    };
}

interface ProjectWithTeams {
    id: string;
    name: string;
    status: string;
    teams: Team[];
}

const ROLE_COLORS: Record<string, string> = {
    lead: 'bg-violet-100 text-violet-700 border-violet-200',
    manager: 'bg-amber-100 text-amber-700 border-amber-200',
    member: 'bg-sky-100 text-sky-700 border-sky-200',
    senior: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

function roleBadge(role: string) {
    return ROLE_COLORS[role.toLowerCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';
}

export default function TeamsList() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectWithTeams[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadTeams = async () => {
        setLoading(true);
        try {
            const allProjects = await projectApi.getAll();
            const withTeams: ProjectWithTeams[] = [];
            for (const p of allProjects) {
                try {
                    const teams = await projectApi.getTeams(p.id);
                    if (teams && teams.length > 0) {
                        withTeams.push({ id: p.id, name: p.name, status: p.status, teams });
                    }
                } catch {
                    // Project may not have teams endpoint; skip
                }
            }
            setProjects(withTeams);
        } catch (err) {
            console.error('Failed to load teams:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTeams(); }, []);

    const allTeams = useMemo(() => {
        const out: Array<{ team: Team; projectName: string; projectId: string }> = [];
        for (const p of projects) {
            for (const t of p.teams) {
                out.push({ team: t, projectName: p.name, projectId: p.id });
            }
        }
        return out;
    }, [projects]);

    const filtered = useMemo(() => {
        if (!search.trim()) return allTeams;
        const q = search.toLowerCase();
        return allTeams.filter(({ team, projectName }) =>
            team.name.toLowerCase().includes(q) ||
            projectName.toLowerCase().includes(q) ||
            (team.members ?? []).some(m =>
                m.employee && `${m.employee.firstName} ${m.employee.lastName}`.toLowerCase().includes(q)
            )
        );
    }, [allTeams, search]);

    const stats = useMemo(() => ({
        totalSquads: allTeams.length,
        totalMembers: allTeams.reduce((acc, { team }) => acc + (team.members?.length ?? 0), 0),
        projects: projects.length,
    }), [allTeams, projects]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 p-6 pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Squads & Teams</h1>
                            <p className="text-sm text-slate-500">All teams across projects · click a squad to see details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white"
                            onClick={() => navigate('/dashboard/organization')}
                        >
                            <UserPlus className="w-4 h-4 mr-1.5" /> Create Squad
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadTeams} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Squads</div>
                            <div className="text-xl font-bold text-slate-900">{stats.totalSquads}</div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Total Members</div>
                            <div className="text-xl font-bold text-slate-900">{stats.totalMembers}</div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                            <FolderKanban className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Projects</div>
                            <div className="text-xl font-bold text-slate-900">{stats.projects}</div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search squads, projects, or members…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 pb-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-sm text-slate-500">Loading squads…</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No squads found</h3>
                        <p className="text-slate-500 text-sm">Create a squad from the Organization page</p>
                    </div>
                ) : (
                    <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                        {filtered.map(({ team, projectName, projectId }) => {
                            const members = team.members ?? [];
                            const leadMember = members.find(m => m.role === 'lead' || m.employeeId === team.leadId);
                            const regularMembers = members.filter(m => m !== leadMember);
                            const avgAlloc = members.length > 0
                                ? Math.round(members.reduce((a, m) => a + (m.allocationPercentage ?? 0), 0) / members.length)
                                : 0;

                            return (
                                <Card key={team.id} className="bg-white border-slate-200/60 hover:border-indigo-300 hover:shadow-lg transition-all rounded-2xl overflow-hidden group">
                                    <CardContent className="p-0">
                                        {/* Gradient header */}
                                        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-4 text-white">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-bold truncate">{team.name}</h3>
                                                    <p className="text-xs text-white/70 truncate mt-0.5">{projectName}</p>
                                                </div>
                                                <Badge className="bg-white/20 text-white border-0 text-xs font-bold">
                                                    {members.length} member{members.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            {team.description && (
                                                <p className="text-xs text-white/60 mt-2 truncate">{team.description}</p>
                                            )}
                                        </div>

                                        <div className="p-4 space-y-3">
                                            {/* Lead */}
                                            {leadMember?.employee && (
                                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center text-xs font-bold shadow">
                                                        {leadMember.employee.firstName?.[0]}{leadMember.employee.lastName?.[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-slate-900 truncate">
                                                            {leadMember.employee.firstName} {leadMember.employee.lastName}
                                                        </div>
                                                        <div className="text-xs text-slate-500 truncate">{leadMember.employee.designation}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Crown className="w-3.5 h-3.5 text-violet-500" />
                                                        <span className="text-[10px] font-bold text-violet-700 uppercase">Lead</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Members */}
                                            <div className="space-y-1">
                                                {regularMembers.slice(0, 5).map(m => (
                                                    <div
                                                        key={m.id}
                                                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                                                        onClick={() => m.employee && navigate(`/dashboard/employees/${m.employee.id}`)}
                                                    >
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold">
                                                            {m.employee?.firstName?.[0]}{m.employee?.lastName?.[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-semibold text-slate-800 truncate">
                                                                {m.employee ? `${m.employee.firstName} ${m.employee.lastName}` : m.employeeId}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 truncate">{m.employee?.designation}</div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${roleBadge(m.role)}`}>
                                                                {m.role}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 font-medium">
                                                                {m.allocationPercentage}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {regularMembers.length > 5 && (
                                                    <div className="text-xs text-slate-500 text-center py-1">
                                                        +{regularMembers.length - 5} more members
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Avg. Allocation</span>
                                                    <span className={`text-xs font-bold ${avgAlloc < 60 ? 'text-emerald-600' : avgAlloc < 85 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                        {avgAlloc}%
                                                    </span>
                                                </div>
                                                {/* Stacked avatars */}
                                                <div className="flex -space-x-2">
                                                    {members.slice(0, 6).map((m, i) => (
                                                        <div
                                                            key={m.id}
                                                            className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white"
                                                            title={m.employee ? `${m.employee.firstName} ${m.employee.lastName}` : ''}
                                                        >
                                                            {m.employee?.firstName?.[0]}{m.employee?.lastName?.[0]}
                                                        </div>
                                                    ))}
                                                    {members.length > 6 && (
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center border-2 border-white">
                                                            +{members.length - 6}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
