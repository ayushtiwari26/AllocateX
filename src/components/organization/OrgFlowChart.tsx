/**
 * Interactive Organization Flow Chart
 * -----------------------------------
 * - Pannable / zoomable React Flow canvas with dagre auto-layout.
 * - Collapsible subtrees — click the chevron pill on any manager node.
 * - Per-node action menu: promote to Tech Lead / Tech Consultant, reassign manager,
 *   add to an existing squad, or start a new squad pre-populated with this person.
 * - "Create Squad" dialog persists a team (with name, lead, members) to the backend
 *   via projectApi.addTeam + addMember under the umbrella project.
 * - All changes are saved to the backend immediately; click "Refresh" or the
 *   structure reloads automatically after saves.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    Handle,
    Position,
    MarkerType,
    useNodesState,
    useEdgesState,
    useReactFlow,
    type Node,
    type Edge,
    type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Users, Crown, Star, Briefcase, Sparkles, TrendingUp,
    Search, RefreshCw, Loader2, Maximize2, X, Plus,
    Mail, Building2, Network, Focus, Layers,
    MoreVertical, ChevronDown, ChevronRight, UserPlus,
    ArrowUpCircle, Shield, Save, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { employeeApi, projectApi } from '@/services/api';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
    department: string;
    reportingManagerId: string | null;
    isActive: boolean;
    currentWorkload?: number;
    teamMemberships?: Array<{
        role: string;
        allocationPercentage: number;
        team?: { id: string; name: string; project?: { id: string; name: string } };
    }>;
}

// ---------- Role tiers ----------------------------------------------------
const TIERS = [
    { label: 'Tech Consultant', rank: 100, icon: Crown, gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-200', color: '#f59e0b', match: (t: string) => /tech consultant/i.test(t) },
    { label: 'Tech Lead', rank: 90, icon: Crown, gradient: 'from-violet-500 to-fuchsia-600', glow: 'shadow-violet-200', color: '#8b5cf6', match: (t: string) => /tech lead|team lead/i.test(t) },
    { label: 'Senior', rank: 80, icon: Star, gradient: 'from-indigo-500 to-blue-600', glow: 'shadow-indigo-200', color: '#6366f1', match: (t: string) => /senior|sde\s*[-\s]?(ii|2)/i.test(t) },
    { label: 'Engineer', rank: 70, icon: Briefcase, gradient: 'from-sky-500 to-cyan-600', glow: 'shadow-sky-200', color: '#0ea5e9', match: (t: string) => /sde|software development engineer|front-?end|devops/i.test(t) },
    { label: 'Business Analyst', rank: 60, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-200', color: '#10b981', match: (t: string) => /business analyst/i.test(t) },
    { label: 'QA', rank: 55, icon: Briefcase, gradient: 'from-rose-500 to-pink-600', glow: 'shadow-rose-200', color: '#f43f5e', match: (t: string) => /qa|test engineer/i.test(t) },
    { label: 'Designer', rank: 50, icon: Sparkles, gradient: 'from-pink-500 to-rose-600', glow: 'shadow-pink-200', color: '#ec4899', match: (t: string) => /ui|ux|designer/i.test(t) },
    { label: 'Support', rank: 30, icon: Users, gradient: 'from-slate-500 to-slate-700', glow: 'shadow-slate-200', color: '#64748b', match: (t: string) => /support|ticketing/i.test(t) },
    { label: 'Team', rank: 0, icon: Users, gradient: 'from-slate-400 to-slate-500', glow: 'shadow-slate-200', color: '#94a3b8', match: () => true },
] as const;
const tierFor = (d: string) => TIERS.find(t => t.match(d || '')) ?? TIERS[TIERS.length - 1];

// ---------- Custom node ---------------------------------------------------
type NodeActions = {
    onOpenDetails: (e: Employee) => void;
    onToggleCollapse: (id: string) => void;
    onPromote: (e: Employee, to: 'Tech Lead' | 'Tech Consultant') => void;
    onReassign: (e: Employee) => void;
    onAddToSquad: (e: Employee) => void;
    onStartSquad: (e: Employee) => void;
};

type EmpNodeData = {
    employee: Employee;
    directReports: number;
    totalSubordinates: number;
    collapsed: boolean;
    dimmed: boolean;
    highlighted: boolean;
    actions: NodeActions;
};

function EmployeeNode({ data }: NodeProps<Node<EmpNodeData>>) {
    const { employee, directReports, totalSubordinates, collapsed, dimmed, highlighted, actions } = data;
    const tier = tierFor(employee.designation || '');
    const Icon = tier.icon;
    const initials = `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: dimmed ? 0.22 : 1, scale: highlighted ? 1.04 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative"
        >
            <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border-0" />

            <div
                className={`w-[280px] rounded-2xl bg-white border ${highlighted ? 'border-indigo-400 ring-4 ring-indigo-200/60' : 'border-slate-200'} shadow-md hover:shadow-xl transition-all overflow-hidden`}
            >
                {/* Accent header */}
                <div className={`h-1.5 bg-gradient-to-r ${tier.gradient}`} />

                <div className="p-3.5">
                    <div className="flex items-start gap-3">
                        <div className={`relative shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${tier.gradient} text-white flex items-center justify-center shadow-lg ${tier.glow} font-bold text-base`}>
                            {initials || <Icon className="w-5 h-5" />}
                            {directReports > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-white text-[10px] font-bold text-slate-700 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow border border-slate-200">
                                    {directReports}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => actions.onOpenDetails(employee)}
                            className="flex-1 min-w-0 text-left"
                        >
                            <div className="text-sm font-bold text-slate-900 truncate hover:text-indigo-600">
                                {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{employee.designation}</div>
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="text-xs text-slate-500">
                                    {employee.firstName} {employee.lastName}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => actions.onPromote(employee, 'Tech Lead')}>
                                    <ArrowUpCircle className="w-4 h-4 mr-2 text-violet-500" /> Make Tech Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => actions.onPromote(employee, 'Tech Consultant')}>
                                    <Crown className="w-4 h-4 mr-2 text-amber-500" /> Make Tech Consultant
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => actions.onReassign(employee)}>
                                    <Shield className="w-4 h-4 mr-2 text-indigo-500" /> Reassign Manager…
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => actions.onAddToSquad(employee)}>
                                    <UserPlus className="w-4 h-4 mr-2 text-emerald-500" /> Add to Squad…
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => actions.onStartSquad(employee)}>
                                    <Plus className="w-4 h-4 mr-2 text-sky-500" /> Create Squad with…
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gradient-to-br ${tier.gradient} text-white`}>
                            <Icon className="w-3 h-3" /> {tier.label}
                        </span>
                        {employee.department && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-[120px]" title={employee.department}>
                                {employee.department}
                            </span>
                        )}
                        {typeof employee.currentWorkload === 'number' && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${employee.currentWorkload < 60 ? 'bg-emerald-50 text-emerald-700' : employee.currentWorkload < 85 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                                {employee.currentWorkload}% load
                            </span>
                        )}
                    </div>
                </div>

                {directReports > 0 && (
                    <button
                        onClick={() => actions.onToggleCollapse(employee.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border-t border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-indigo-700 transition"
                    >
                        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {collapsed ? `Show ${totalSubordinates} reports` : `Hide ${totalSubordinates} reports`}
                    </button>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-0" />
        </motion.div>
    );
}

const nodeTypes = { employee: EmployeeNode };

// ---------- Auto-layout ---------------------------------------------------
const NODE_W = 280;
const NODE_H = 160;

function layoutGraph(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 90, marginx: 40, marginy: 40 });

    nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
    edges.forEach(e => g.setEdge(e.source, e.target));
    dagre.layout(g);

    return nodes.map(n => {
        const p = g.node(n.id);
        return {
            ...n,
            targetPosition: direction === 'LR' ? Position.Left : Position.Top,
            sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
            position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
        } as Node;
    });
}

// ---------- Main inner component -----------------------------------------
type PendingSquad = { forEmployee?: Employee };
type Toast = { kind: 'success' | 'error'; message: string };

function OrgFlowInner() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Employee | null>(null);
    const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [initialCollapseApplied, setInitialCollapseApplied] = useState(false);
    const [pendingReassignments, setPendingReassignments] = useState<Map<string, string | null>>(new Map());

    const [nodes, setNodes, onNodesChange] = useNodesState<Node<EmpNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const [reassignFor, setReassignFor] = useState<Employee | null>(null);
    const [addToSquadFor, setAddToSquadFor] = useState<Employee | null>(null);
    const [squadDialog, setSquadDialog] = useState<PendingSquad | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);

    // Project list used for squad association
    const [projects, setProjects] = useState<Array<{ id: string; name: string; teams?: any[] }>>([]);

    const rf = useReactFlow();
    const containerRef = useRef<HTMLDivElement>(null);

    const showToast = (kind: Toast['kind'], message: string) => {
        setToast({ kind, message });
        setTimeout(() => setToast(null), 2600);
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [emps, projs] = await Promise.all([employeeApi.getAll(), projectApi.getAll()]);
            setEmployees(Array.isArray(emps) ? emps : []);
            setProjects(Array.isArray(projs) ? projs : []);
        } catch (err) {
            console.error('[OrgFlow] load failed', err);
            setEmployees([]);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Auto-collapse all managers on first load so only top-level roots + their direct children are visible
    useEffect(() => {
        if (initialCollapseApplied || !employees.length) return;
        const managersToCollapse = new Set<string>();
        // Collapse level-1+ managers (children of roots) so the tree starts compact
        const roots = employees.filter(e => !e.reportingManagerId || !employees.some(p => p.id === e.reportingManagerId));
        const rootIds = new Set(roots.map(r => r.id));
        for (const e of employees) {
            // If this employee has children and is NOT a root, collapse them
            const hasKids = employees.some(c => c.reportingManagerId === e.id);
            if (hasKids && !rootIds.has(e.id)) {
                managersToCollapse.add(e.id);
            }
        }
        setCollapsed(managersToCollapse);
        setInitialCollapseApplied(true);
    }, [employees, initialCollapseApplied]);

    // Find the umbrella project (first one; or one named "IT Department")
    const umbrellaProject = useMemo(() => {
        if (!projects.length) return null;
        return projects.find(p => /it department|gembaconnect/i.test(p.name)) ?? projects[0];
    }, [projects]);

    // Children index + total subordinate count
    const reportIndex = useMemo(() => {
        const direct = new Map<string, number>();
        const children = new Map<string, string[]>();
        for (const e of employees) {
            if (e.reportingManagerId) {
                direct.set(e.reportingManagerId, (direct.get(e.reportingManagerId) ?? 0) + 1);
                const arr = children.get(e.reportingManagerId) ?? [];
                arr.push(e.id);
                children.set(e.reportingManagerId, arr);
            }
        }
        const cache = new Map<string, number>();
        const totalFor = (id: string): number => {
            if (cache.has(id)) return cache.get(id)!;
            const kids = children.get(id) ?? [];
            let n = kids.length;
            for (const k of kids) n += totalFor(k);
            cache.set(id, n);
            return n;
        };
        return { direct, children, totalFor };
    }, [employees]);

    // Build set of visible node ids, respecting collapse state
    const visibleIds = useMemo(() => {
        const set = new Set<string>();
        const roots = employees.filter(e => !e.reportingManagerId || !employees.some(p => p.id === e.reportingManagerId));
        const walk = (id: string) => {
            set.add(id);
            if (collapsed.has(id)) return;
            const kids = reportIndex.children.get(id) ?? [];
            for (const k of kids) walk(k);
        };
        for (const r of roots) walk(r.id);
        return set;
    }, [employees, collapsed, reportIndex]);

    // Search-driven highlight + ancestor chain
    const { highlightIds, matchIds } = useMemo(() => {
        if (!search.trim()) return { highlightIds: new Set<string>(), matchIds: new Set<string>() };
        const q = search.toLowerCase();
        const matches = employees.filter(e =>
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
            (e.designation ?? '').toLowerCase().includes(q) ||
            (e.department ?? '').toLowerCase().includes(q)
        );
        const matchSet = new Set(matches.map(m => m.id));
        const hi = new Set<string>(matchSet);
        const byId = new Map(employees.map(e => [e.id, e]));
        for (const m of matches) {
            let cur = m.reportingManagerId;
            while (cur) {
                if (hi.has(cur)) break;
                hi.add(cur);
                cur = byId.get(cur)?.reportingManagerId ?? null;
            }
        }
        return { highlightIds: hi, matchIds: matchSet };
    }, [employees, search]);

    // Node actions
    const handleToggleCollapse = useCallback((id: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const handlePromote = useCallback(async (emp: Employee, to: 'Tech Lead' | 'Tech Consultant') => {
        try {
            setSaving(true);
            await employeeApi.update(emp.id, { designation: to });
            setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, designation: to } : e));
            showToast('success', `${emp.firstName} is now ${to}`);
        } catch (err) {
            console.error(err);
            showToast('error', 'Promotion failed');
        } finally {
            setSaving(false);
        }
    }, []);

    const handleReassignSubmit = async (newManagerId: string | null) => {
        if (!reassignFor) return;
        // Prevent cycles: newManagerId cannot be a descendant
        if (newManagerId) {
            const descendants = new Set<string>();
            const stack = [reassignFor.id];
            while (stack.length) {
                const cur = stack.pop()!;
                for (const k of reportIndex.children.get(cur) ?? []) {
                    descendants.add(k); stack.push(k);
                }
            }
            if (descendants.has(newManagerId)) {
                showToast('error', 'Cannot assign under a subordinate');
                return;
            }
        }
        try {
            setSaving(true);
            await employeeApi.update(reassignFor.id, { reportingManagerId: newManagerId });
            setEmployees(prev => prev.map(e => e.id === reassignFor.id ? { ...e, reportingManagerId: newManagerId } : e));
            showToast('success', 'Reporting updated');
            setReassignFor(null);
        } catch (err) {
            console.error(err);
            showToast('error', 'Reassign failed');
        } finally {
            setSaving(false);
        }
    };

    const handleAddToSquad = async (teamId: string) => {
        if (!addToSquadFor || !umbrellaProject) return;
        try {
            setSaving(true);
            await projectApi.addMember(umbrellaProject.id, teamId, {
                employeeId: addToSquadFor.id,
                role: 'member',
                allocationPercentage: 60,
            });
            showToast('success', 'Added to squad');
            setAddToSquadFor(null);
            await loadAll();
        } catch (err: any) {
            console.error(err);
            showToast('error', err?.response?.data?.error || 'Failed to add');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateSquad = async (payload: { name: string; description: string; leadId: string; memberIds: string[] }) => {
        if (!umbrellaProject) {
            showToast('error', 'No umbrella project configured');
            return;
        }
        try {
            setSaving(true);
            const team: any = await projectApi.addTeam(umbrellaProject.id, {
                name: payload.name,
                description: payload.description,
                leadId: payload.leadId || undefined,
            });
            const teamId = team?.id;
            if (teamId) {
                for (const id of payload.memberIds) {
                    if (id === payload.leadId) continue;
                    try {
                        await projectApi.addMember(umbrellaProject.id, teamId, {
                            employeeId: id,
                            role: 'member',
                            allocationPercentage: 80,
                        });
                    } catch (e) { console.warn('member add failed', e); }
                }
            }
            showToast('success', `Squad "${payload.name}" created`);
            setSquadDialog(null);
            await loadAll();
        } catch (err: any) {
            console.error(err);
            showToast('error', err?.response?.data?.error || 'Create failed');
        } finally {
            setSaving(false);
        }
    };

    // Handle drag-drop onto another node → stage a reassignment
    const handleNodeDragStop = useCallback((_event: any, draggedNode: Node) => {
        // Find the closest node within drop range
        const dragCenter = { x: draggedNode.position.x + NODE_W / 2, y: draggedNode.position.y + NODE_H / 2 };
        let closestId: string | null = null;
        let closestDist = Infinity;
        for (const n of nodes) {
            if (n.id === draggedNode.id) continue;
            const cx = n.position.x + NODE_W / 2;
            const cy = n.position.y + NODE_H / 2;
            const d = Math.hypot(dragCenter.x - cx, dragCenter.y - cy);
            if (d < 160 && d < closestDist) {
                closestDist = d;
                closestId = n.id;
            }
        }
        if (!closestId) return;
        const emp = employees.find(e => e.id === draggedNode.id);
        if (!emp || emp.reportingManagerId === closestId) return;
        // Prevent cycles
        const isDesc = (parentId: string, childId: string): boolean => {
            const kids = reportIndex.children.get(parentId) ?? [];
            for (const k of kids) { if (k === childId || isDesc(k, childId)) return true; }
            return false;
        };
        if (isDesc(draggedNode.id, closestId)) {
            showToast('error', 'Cannot assign under own subordinate');
            return;
        }
        // Stage the reassignment (batch save)
        setEmployees(prev => prev.map(e => e.id === draggedNode.id ? { ...e, reportingManagerId: closestId } : e));
        setPendingReassignments(prev => new Map(prev).set(draggedNode.id, closestId));
        showToast('success', `${emp.firstName} → reports to ${employees.find(e => e.id === closestId)?.firstName ?? 'new manager'}. Click "Save Structure" to persist.`);
    }, [nodes, employees, reportIndex]);

    // Batch-save all pending reassignments
    const handleSaveStructure = useCallback(async () => {
        if (pendingReassignments.size === 0) return;
        setSaving(true);
        let ok = 0;
        let fail = 0;
        for (const [empId, managerId] of pendingReassignments) {
            try {
                await employeeApi.update(empId, { reportingManagerId: managerId });
                ok++;
            } catch {
                fail++;
            }
        }
        setPendingReassignments(new Map());
        setSaving(false);
        if (fail === 0) showToast('success', `Structure saved (${ok} change${ok > 1 ? 's' : ''})`);
        else showToast('error', `${ok} saved, ${fail} failed`);
        await loadAll();
    }, [pendingReassignments, loadAll]);

    const actions: NodeActions = useMemo(() => ({
        onOpenDetails: (e) => setSelected(e),
        onToggleCollapse: handleToggleCollapse,
        onPromote: handlePromote,
        onReassign: (e) => setReassignFor(e),
        onAddToSquad: (e) => setAddToSquadFor(e),
        onStartSquad: (e) => setSquadDialog({ forEmployee: e }),
    }), [handleToggleCollapse, handlePromote]);

    // Build graph from employee data + visibility/collapse + search
    useEffect(() => {
        if (!employees.length) { setNodes([]); setEdges([]); return; }

        const empNodes: Node<EmpNodeData>[] = employees
            .filter(e => visibleIds.has(e.id))
            .map(e => {
                const dimmed = search.trim().length > 0 && !highlightIds.has(e.id);
                const highlighted = matchIds.has(e.id);
                return {
                    id: e.id,
                    type: 'employee',
                    position: { x: 0, y: 0 },
                    data: {
                        employee: e,
                        directReports: reportIndex.direct.get(e.id) ?? 0,
                        totalSubordinates: reportIndex.totalFor(e.id),
                        collapsed: collapsed.has(e.id),
                        dimmed,
                        highlighted,
                        actions,
                    },
                };
            });

        const empEdges: Edge[] = employees
            .filter(e => e.reportingManagerId && visibleIds.has(e.id) && visibleIds.has(e.reportingManagerId!))
            .map(e => {
                const onPath = highlightIds.has(e.id) && highlightIds.has(e.reportingManagerId!);
                const anySearch = search.trim().length > 0;
                return {
                    id: `${e.reportingManagerId}->${e.id}`,
                    source: e.reportingManagerId!,
                    target: e.id,
                    type: 'smoothstep',
                    animated: onPath,
                    style: {
                        stroke: anySearch && !onPath ? '#e2e8f0' : '#94a3b8',
                        strokeWidth: onPath ? 2.4 : 1.5,
                        opacity: anySearch && !onPath ? 0.25 : 1,
                    },
                    markerEnd: { type: MarkerType.ArrowClosed, color: onPath ? '#6366f1' : '#94a3b8' },
                };
            });

        const laid = layoutGraph(empNodes, empEdges, direction);
        setNodes(laid as Node<EmpNodeData>[]);
        setEdges(empEdges);

        // Gentle fit — cap zoom so node text stays readable; with collapsed tree usually <10 nodes → zoom ~0.8-1.0
        setTimeout(() => rf.fitView({ padding: 0.3, maxZoom: 1.2, minZoom: 0.4, duration: 500 }), 50);
    }, [employees, visibleIds, reportIndex, collapsed, highlightIds, matchIds, search, direction, actions, setNodes, setEdges, rf]);

    // Focus camera on first search match
    useEffect(() => {
        if (!search.trim() || matchIds.size === 0) return;
        const firstId = Array.from(matchIds)[0];
        const node = nodes.find(n => n.id === firstId);
        if (node) rf.setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, { zoom: 1.1, duration: 600 });
    }, [matchIds, nodes, rf, search]);

    const stats = useMemo(() => {
        const total = employees.length;
        const execs = employees.filter(e => !e.reportingManagerId).length;
        const leads = employees.filter(e => e.reportingManagerId && (reportIndex.direct.get(e.id) ?? 0) > 0).length;
        const members = total - execs - leads;
        return { total, execs, leads, members };
    }, [employees, reportIndex]);

    const handleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.();
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative">
            {/* Header */}
            <div className="shrink-0 px-6 pt-5 pb-3 border-b border-slate-200/70 bg-white/80 backdrop-blur">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                            <Network className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Organization Chart</h1>
                            <p className="text-xs text-slate-500">Click a node for details · menu for actions · collapse deep branches · create squads</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs font-medium">
                            <button
                                onClick={() => setDirection('TB')}
                                className={`px-2.5 py-1 rounded-lg transition ${direction === 'TB' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Layers className="w-3.5 h-3.5 inline mr-1" /> Vertical
                            </button>
                            <button
                                onClick={() => setDirection('LR')}
                                className={`px-2.5 py-1 rounded-lg transition ${direction === 'LR' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Network className="w-3.5 h-3.5 inline mr-1" /> Horizontal
                            </button>
                        </div>
                        {pendingReassignments.size > 0 && (
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white animate-pulse"
                                onClick={handleSaveStructure}
                                disabled={saving}
                            >
                                <Save className="w-4 h-4 mr-1.5" /> Save Structure ({pendingReassignments.size})
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white"
                            onClick={() => setSquadDialog({})}
                        >
                            <Plus className="w-4 h-4 mr-1.5" /> Create Squad
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => rf.fitView({ padding: 0.25, maxZoom: 1, duration: 500 })}>
                            <Focus className="w-4 h-4 mr-1.5" /> Fit
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleFullscreen}>
                            <Maximize2 className="w-4 h-4 mr-1.5" /> Fullscreen
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadAll} disabled={loading || saving}>
                            {loading || saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatCard icon={Users} label="Total" value={stats.total} gradient="from-indigo-500 to-violet-500" />
                    <StatCard icon={Crown} label="Executives" value={stats.execs} gradient="from-amber-500 to-orange-500" />
                    <StatCard icon={Star} label="Leads" value={stats.leads} gradient="from-violet-500 to-fuchsia-600" />
                    <StatCard icon={Briefcase} label="Members" value={stats.members} gradient="from-emerald-500 to-teal-600" />
                    <div className="relative col-span-2 md:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search name / role / dept"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-full bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Graph */}
            <div className="flex-1 relative min-h-[500px]">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-sm">Loading organization…</p>
                        </div>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">No employees found. Seed the database first.</p>
                        </div>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeDragStop={handleNodeDragStop}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.3, maxZoom: 1.2, minZoom: 0.4 }}
                        minZoom={0.15}
                        maxZoom={3}
                        defaultEdgeOptions={{ type: 'smoothstep' }}
                        proOptions={{ hideAttribution: true }}
                        nodesDraggable
                        nodesConnectable={false}
                        elementsSelectable
                    >
                        <Background variant={BackgroundVariant.Dots} gap={24} size={1.4} color="#cbd5e1" />
                        <Controls position="bottom-right" showInteractive={false} className="!bg-white !border !border-slate-200 !rounded-xl !shadow-md" />
                        <MiniMap
                            position="bottom-left"
                            pannable zoomable
                            className="!bg-white !border !border-slate-200 !rounded-xl !shadow-md"
                            nodeColor={(n) => tierFor(((n.data as EmpNodeData | undefined)?.employee.designation) || '').color}
                            maskColor="rgba(15,23,42,0.06)"
                        />
                    </ReactFlow>
                )}
            </div>

            {/* Saving indicator */}
            {saving && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow flex items-center gap-2 text-xs font-medium text-slate-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> Saving…
                </div>
            )}

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${toast.kind === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}
                    >
                        {toast.kind === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail drawer */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                        className="absolute top-0 right-0 h-full w-[360px] bg-white border-l border-slate-200 shadow-2xl z-20 flex flex-col"
                    >
                        <EmployeeDetails
                            employee={selected}
                            reportsCount={reportIndex.direct.get(selected.id) ?? 0}
                            totalSubs={reportIndex.totalFor(selected.id)}
                            onClose={() => setSelected(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reassign manager dialog */}
            <ReassignDialog
                open={!!reassignFor}
                employee={reassignFor}
                employees={employees}
                onClose={() => setReassignFor(null)}
                onSubmit={handleReassignSubmit}
            />

            {/* Add to squad dialog */}
            <AddToSquadDialog
                open={!!addToSquadFor}
                employee={addToSquadFor}
                projects={projects}
                onClose={() => setAddToSquadFor(null)}
                onSubmit={handleAddToSquad}
            />

            {/* Create squad dialog */}
            <CreateSquadDialog
                open={!!squadDialog}
                defaultEmployee={squadDialog?.forEmployee}
                employees={employees}
                umbrellaProjectName={umbrellaProject?.name ?? 'Umbrella Project'}
                onClose={() => setSquadDialog(null)}
                onSubmit={handleCreateSquad}
            />
        </div>
    );
}

// ---------- Sub-components ------------------------------------------------
function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: number; gradient: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
                <div className="text-xl font-bold text-slate-900 leading-tight">{value}</div>
            </div>
        </div>
    );
}

function EmployeeDetails({ employee, onClose, reportsCount, totalSubs }: { employee: Employee; onClose: () => void; reportsCount: number; totalSubs: number }) {
    const tier = tierFor(employee.designation || '');
    const Icon = tier.icon;
    const initials = `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase();
    const projects = (employee.teamMemberships ?? []).reduce<Map<string, { name: string; alloc: number; team?: string }>>((acc, tm) => {
        const p = tm.team?.project;
        if (!p) return acc;
        const existing = acc.get(p.id);
        if (existing) existing.alloc += tm.allocationPercentage ?? 0;
        else acc.set(p.id, { name: p.name, alloc: tm.allocationPercentage ?? 0, team: tm.team?.name });
        return acc;
    }, new Map());

    return (
        <div className="flex flex-col h-full">
            <div className={`bg-gradient-to-br ${tier.gradient} text-white p-6 relative`}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30">
                    <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold ring-4 ring-white/30">
                        {initials || <Icon className="w-7 h-7" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{employee.firstName} {employee.lastName}</h2>
                        <p className="text-sm text-white/85">{employee.designation}</p>
                        <Badge className="mt-2 bg-white/20 hover:bg-white/25 text-white border-0">
                            <Icon className="w-3 h-3 mr-1" /> {tier.label}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4 overflow-auto">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Direct reports</div>
                        <div className="text-xl font-bold text-slate-900">{reportsCount}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Total subordinates</div>
                        <div className="text-xl font-bold text-slate-900">{totalSubs}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{employee.email}</span>
                    </div>
                    {employee.department && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{employee.department}</span>
                        </div>
                    )}
                    {typeof employee.currentWorkload === 'number' && (
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500 font-medium">Workload</span>
                                <span className={`font-bold ${employee.currentWorkload < 60 ? 'text-emerald-600' : employee.currentWorkload < 85 ? 'text-amber-600' : 'text-rose-600'}`}>{employee.currentWorkload}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${employee.currentWorkload < 60 ? 'bg-emerald-500' : employee.currentWorkload < 85 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.min(employee.currentWorkload, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {projects.size > 0 && (
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Squads & projects</div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from(projects.values()).map((p, i) => (
                                <span key={i} className="px-2 py-1 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100" title={p.team ? `${p.team}` : undefined}>
                                    {p.name} · {p.alloc}%
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReassignDialog({ open, employee, employees, onClose, onSubmit }: {
    open: boolean;
    employee: Employee | null;
    employees: Employee[];
    onClose: () => void;
    onSubmit: (newManagerId: string | null) => void;
}) {
    const [query, setQuery] = useState('');
    const candidates = useMemo(() => {
        if (!employee) return [];
        const q = query.toLowerCase();
        return employees
            .filter(e => e.id !== employee.id)
            .filter(e => !q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || (e.designation ?? '').toLowerCase().includes(q))
            .slice(0, 60);
    }, [employees, employee, query]);

    useEffect(() => { if (open) setQuery(''); }, [open]);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Reassign manager</DialogTitle>
                    <DialogDescription>
                        Choose a new reporting manager for <b>{employee?.firstName} {employee?.lastName}</b>. Select “no manager” to make them a top-level executive.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <Input placeholder="Search people" value={query} onChange={e => setQuery(e.target.value)} />
                    <Button variant="outline" className="w-full justify-start" onClick={() => onSubmit(null)}>
                        <Crown className="w-4 h-4 mr-2 text-amber-500" /> No manager (top-level)
                    </Button>
                    <div className="max-h-[320px] overflow-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                        {candidates.map(c => {
                            const tier = tierFor(c.designation);
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => onSubmit(c.id)}
                                    className="w-full flex items-center gap-3 p-2.5 hover:bg-indigo-50 text-left"
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.gradient} text-white flex items-center justify-center text-xs font-bold`}>
                                        {c.firstName?.[0]}{c.lastName?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-800 truncate">{c.firstName} {c.lastName}</div>
                                        <div className="text-xs text-slate-500 truncate">{c.designation}</div>
                                    </div>
                                </button>
                            );
                        })}
                        {candidates.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-500">No matches</div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddToSquadDialog({ open, employee, projects, onClose, onSubmit }: {
    open: boolean;
    employee: Employee | null;
    projects: Array<{ id: string; name: string; teams?: any[] }>;
    onClose: () => void;
    onSubmit: (teamId: string) => void;
}) {
    const teams = useMemo(() => {
        const out: Array<{ id: string; name: string; projectName: string }> = [];
        for (const p of projects) {
            for (const t of (p.teams ?? [])) {
                out.push({ id: t.id, name: t.name, projectName: p.name });
            }
        }
        return out;
    }, [projects]);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add to an existing squad</DialogTitle>
                    <DialogDescription>
                        Assign <b>{employee?.firstName} {employee?.lastName}</b> as a member of an existing squad.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {teams.length === 0 && (
                        <div className="p-6 text-center text-sm text-slate-500">No squads yet. Create one first.</div>
                    )}
                    {teams.map(t => (
                        <button key={t.id} onClick={() => onSubmit(t.id)} className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 text-left">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-800 truncate">{t.name}</div>
                                <div className="text-xs text-slate-500 truncate">{t.projectName}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateSquadDialog({ open, defaultEmployee, employees, umbrellaProjectName, onClose, onSubmit }: {
    open: boolean;
    defaultEmployee?: Employee;
    employees: Employee[];
    umbrellaProjectName: string;
    onClose: () => void;
    onSubmit: (payload: { name: string; description: string; leadId: string; memberIds: string[] }) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [leadId, setLeadId] = useState<string>('');
    const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (open) {
            setName(defaultEmployee ? `${defaultEmployee.firstName}'s Squad` : '');
            setDescription('');
            setLeadId(defaultEmployee?.id ?? '');
            setMemberIds(new Set(defaultEmployee ? [defaultEmployee.id] : []));
            setQuery('');
        }
    }, [open, defaultEmployee]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return employees
            .filter(e => !q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || (e.designation ?? '').toLowerCase().includes(q))
            .slice(0, 80);
    }, [employees, query]);

    const toggleMember = (id: string) => {
        setMemberIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const canSubmit = name.trim().length > 0 && leadId && memberIds.size >= 1;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create a squad</DialogTitle>
                    <DialogDescription>
                        New squad will live under <b>{umbrellaProjectName}</b>. Pick a lead and members; they'll be persisted to the team roster.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Squad name</label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Payments Platform" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Description</label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Selected members ({memberIds.size})</label>
                            <div className="mt-1 rounded-lg border border-slate-200 p-2 min-h-[72px] flex flex-wrap gap-1.5">
                                {Array.from(memberIds).map(id => {
                                    const m = employees.find(e => e.id === id);
                                    if (!m) return null;
                                    const isLead = leadId === id;
                                    return (
                                        <span key={id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${isLead ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                            {isLead && <Crown className="w-3 h-3" />}
                                            {m.firstName} {m.lastName}
                                            <button onClick={() => toggleMember(id)} className="ml-1 hover:text-rose-600"><X className="w-3 h-3" /></button>
                                        </span>
                                    );
                                })}
                                {memberIds.size === 0 && <span className="text-xs text-slate-400">No members selected</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Lead</label>
                            <select
                                value={leadId}
                                onChange={e => setLeadId(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">— select lead —</option>
                                {Array.from(memberIds).map(id => {
                                    const m = employees.find(e => e.id === id);
                                    if (!m) return null;
                                    return <option key={id} value={id}>{m.firstName} {m.lastName} · {m.designation}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pick members</label>
                        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people" />
                        <div className="max-h-[280px] overflow-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                            {filtered.map(e => {
                                const tier = tierFor(e.designation);
                                const checked = memberIds.has(e.id);
                                return (
                                    <button key={e.id} onClick={() => toggleMember(e.id)} className={`w-full flex items-center gap-3 p-2.5 text-left ${checked ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                        <input type="checkbox" checked={checked} readOnly className="w-4 h-4" />
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.gradient} text-white flex items-center justify-center text-[11px] font-bold`}>
                                            {e.firstName?.[0]}{e.lastName?.[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-slate-800 truncate">{e.firstName} {e.lastName}</div>
                                            <div className="text-xs text-slate-500 truncate">{e.designation}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        disabled={!canSubmit}
                        className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
                        onClick={() => onSubmit({ name: name.trim(), description: description.trim(), leadId, memberIds: Array.from(memberIds) })}
                    >
                        <Save className="w-4 h-4 mr-1.5" /> Create squad
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---------- Exported wrapper ---------------------------------------------
export default function OrgFlowChart() {
    return (
        <ReactFlowProvider>
            <OrgFlowInner />
        </ReactFlowProvider>
    );
}
