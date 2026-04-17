import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMember, ProjectRequirement } from '@/types/allocation';
import { projectApi, type RoleCandidate } from '@/services/api';
import { Loader2, Plus, Search, Users } from 'lucide-react';

interface AssignPayload {
    employeeId: string;
    role: string;
    allocationPercentage?: number;
}

interface AddMemberDialogProps {
    projectId?: string;
    projectName?: string;
    teamId?: string;
    teamName?: string;
    member?: TeamMember;
    requirements?: ProjectRequirement[];
    teamMembers?: TeamMember[];
    projectMembers?: TeamMember[];
    trigger?: React.ReactNode;
    onAssign?: (payload: AssignPayload) => Promise<void>;
        onUpdate?: (updates: { role?: string; allocationPercentage?: number }) => Promise<void>;
}

const defaultRoles = [
    'Frontend Engineer',
    'Backend Engineer',
    'Full Stack Developer',
    'DevOps Engineer',
    'QA Engineer',
];

const availabilityLabel: Record<'available' | 'partially-available' | 'unavailable', string> = {
    available: 'Available',
    'partially-available': 'Partially booked',
    unavailable: 'Fully booked',
};

export function AddMemberDialog({
    projectId,
    projectName,
    teamId,
    teamName,
    member,
    requirements,
    teamMembers = [],
    projectMembers = [],
    trigger,
    onAssign,
    onUpdate,
}: AddMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [allocation, setAllocation] = useState(member?.allocationPercentage ?? 100);
    const [role, setRole] = useState(member?.role || requirements?.[0]?.role || defaultRoles[0]);
    const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
    const [candidates, setCandidates] = useState<RoleCandidate[]>([]);
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const availableRoles = useMemo(() => {
        const roles = new Set<string>();
        (requirements ?? []).forEach((req) => roles.add(req.role));
        if (member?.role) roles.add(member.role);
        defaultRoles.forEach((defaultRole) => roles.add(defaultRole));
        return Array.from(roles);
    }, [requirements, member]);

    const roleRequirement = useMemo(() => {
        if (!requirements || !role) return undefined;
        const normalized = role.toLowerCase();
        return requirements.find((req) => (req.role || '').toLowerCase() === normalized);
    }, [requirements, role]);

    const projectRoleCount = useMemo(() => {
        const normalized = role.toLowerCase();
        if (!normalized) return 0;
        return projectMembers.filter((memberItem) => (memberItem.role || '').toLowerCase() === normalized).length;
    }, [projectMembers, role]);

    const teamRoleCount = useMemo(() => {
        const normalized = role.toLowerCase();
        if (!normalized) return 0;
        return teamMembers.filter((memberItem) => (memberItem.role || '').toLowerCase() === normalized).length;
    }, [teamMembers, role]);

    const targetCount = roleRequirement?.count ?? 0;
    const remainingSlots = targetCount ? Math.max(0, targetCount - projectRoleCount) : undefined;

    const loadCandidates = useCallback(async (selectedRole: string, availability: 'all' | 'available') => {
        if (!projectId) return;
        try {
            setIsLoadingCandidates(true);
            setError(null);
            const availabilityParam = availability === 'available' ? 'available' : undefined;
            const result = await projectApi.getRoleCandidates(projectId, selectedRole, {
                availability: availabilityParam,
                limit: 16,
            });
            setCandidates(result);
        } catch (err) {
            console.error('Candidate fetch failed', err);
            setError('Unable to load recommended teammates right now.');
        } finally {
            setIsLoadingCandidates(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (!open) return;
        if (member) {
            setAllocation(member.allocationPercentage ?? 100);
            setRole(member.role);
            setError(null);
            return;
        }
        if (!projectId || !role) return;
        setError(null);
        loadCandidates(role, availabilityFilter);
    }, [open, member, projectId, role, availabilityFilter, loadCandidates]);

    const handleAssign = async (candidate: RoleCandidate) => {
        if (!onAssign || !teamId || !projectId) return;
        try {
            setAssigningId(candidate.id);
            await onAssign({
                employeeId: candidate.id,
                role,
                allocationPercentage: allocation,
            });
            setOpen(false);
        } catch (err) {
            console.error('Assign member failed', err);
            setError('Could not allocate the teammate. Please try again.');
        } finally {
            setAssigningId(null);
        }
    };

    const handleUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!onUpdate) {
            setOpen(false);
            return;
        }
        try {
            await onUpdate({ role, allocationPercentage: allocation });
            setOpen(false);
        } catch (err) {
            console.error('Update member failed', err);
            setError('Unable to save changes right now.');
        }
    };

    const dialogTitle = member ? 'Update Assignment' : 'Assign teammate';
    const dialogSubtitle = member
        ? 'Adjust this teammate’s role or capacity allocation.'
        : 'Curated matches from the bench and org pool based on skill fit.';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] bg-white border border-gray-200 text-gray-900">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg font-semibold text-gray-900">{dialogTitle}</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        {projectName && teamName && !member ? `${projectName} • ${teamName} ` : ''}{dialogSubtitle}
                    </DialogDescription>
                </DialogHeader>

                {member ? (
                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div className="grid gap-3">
                            <Label className="text-sm font-medium text-gray-700">Role</Label>
                            <Input
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                placeholder="e.g. Senior Backend Engineer"
                                className="border-gray-300 focus-visible:ring-indigo-500"
                                required
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label className="text-sm font-medium text-gray-700">Allocation %</Label>
                            <Input
                                type="number"
                                min={0}
                                max={150}
                                step={5}
                                value={allocation}
                                onChange={(event) => {
                                    const next = Number(event.target.value);
                                    setAllocation(Number.isNaN(next) ? 0 : Math.max(0, Math.min(150, next)));
                                }}
                                className="border-gray-300 focus-visible:ring-indigo-500"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                                Save changes
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5">
                        <div className="grid gap-3">
                            <Label className="text-sm font-medium text-gray-700">Role requirement</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="border-gray-300 focus-visible:ring-indigo-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {availableRoles.map((roleOption) => (
                                        <SelectItem key={roleOption} value={roleOption}>
                                            {roleOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {roleRequirement && (
                                <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Project coverage</span>
                                        <span className="font-semibold">{projectRoleCount}/{targetCount || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-indigo-600">
                                        <span>Current team</span>
                                        <span>{teamRoleCount}</span>
                                    </div>
                                    {remainingSlots !== undefined && remainingSlots > 0 && (
                                        <p className="text-[11px] text-indigo-700">
                                            Need {remainingSlots} more {remainingSlots === 1 ? 'member' : 'members'} to hit target.
                                        </p>
                                    )}
                                    {remainingSlots !== undefined && remainingSlots === 0 && (
                                        <p className="text-[11px] text-emerald-600 font-medium">Target met for this role.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3">
                            <Label className="text-sm font-medium text-gray-700">Allocation %</Label>
                            <Input
                                type="number"
                                min={0}
                                max={150}
                                step={5}
                                value={allocation}
                                onChange={(event) => {
                                    const next = Number(event.target.value);
                                    setAllocation(Number.isNaN(next) ? 0 : Math.max(0, Math.min(150, next)));
                                }}
                                className="border-gray-300 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            <span className="flex items-center gap-2">
                                <Search className="h-3.5 w-3.5 text-indigo-500" />
                                Skill coverage, availability and workload are considered in these matches.
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={availabilityFilter === 'all' ? 'default' : 'outline'}
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setAvailabilityFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={availabilityFilter === 'available' ? 'default' : 'outline'}
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setAvailabilityFilter('available')}
                                >
                                    Available now
                                </Button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <ScrollArea className="max-h-[320px] rounded-lg border border-gray-200">
                            <div className="divide-y divide-gray-100">
                                {isLoadingCandidates ? (
                                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                        Looking for best-fit teammates…
                                    </div>
                                ) : candidates.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-gray-500">
                                        <Users className="h-6 w-6 text-gray-400" />
                                        No perfect match right now. Try widening availability or updating the role label.
                                    </div>
                                ) : (
                                    candidates.map((candidate) => {
                                        const matchScore = candidate.matchScore ? Math.round(candidate.matchScore * 100) : 0;
                                        const availabilityClass = candidate.availability === 'available'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : candidate.availability === 'partially-available'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-red-50 text-red-700 border-red-200';

                                        return (
                                            <div key={candidate.id} className="flex flex-col gap-3 px-4 py-4 hover:bg-gray-50 transition">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-gray-200">
                                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.firstName + ' ' + candidate.lastName)}&background=indigo&color=fff`} />
                                                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-medium">
                                                                {candidate.firstName[0]}
                                                                {candidate.lastName[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {candidate.firstName} {candidate.lastName}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{candidate.designation}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={`text-xs ${availabilityClass}`}>
                                                            {availabilityLabel[candidate.availability]}
                                                        </Badge>
                                                        {matchScore > 0 && (
                                                            <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                                                                {matchScore}% fit
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {candidate.matchedSkills?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {candidate.matchedSkills.slice(0, 6).map((skill) => (
                                                            <Badge key={skill} variant="outline" className="text-[11px] bg-white border-gray-200 text-gray-600">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="text-xs text-gray-500">
                                                        Current load: {candidate.currentWorkload}h / {candidate.maxCapacity}h · Velocity {candidate.velocity}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                                                        onClick={() => handleAssign(candidate)}
                                                        disabled={assigningId === candidate.id}
                                                    >
                                                        {assigningId === candidate.id ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Assigning
                                                            </>
                                                        ) : (
                                                            'Allocate'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50">
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
