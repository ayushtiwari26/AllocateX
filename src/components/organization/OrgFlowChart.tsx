/**
 * Interactive Organization Flow Chart
 * -----------------------------------
 * Uses @xyflow/react + dagre auto-layout to render the reporting hierarchy
 * as a pannable, zoomable, click-to-focus graph with a minimap, animated
 * connector edges, live search filtering, and in-place role-aware styling.
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
    Users, Crown, Star, Briefcase, Sparkles, TrendingUp,
    Search, RefreshCw, Loader2, Maximize2, X,
    Mail, Building2, Network, Focus, Layers
} from 'lucide-react';
import { employeeApi } from '@/services/api';

interface AllocatedProject {
    id: string;
    name: string;
    allocationPercentage?: number;
}

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

// ---------- Role tiers (same scheme as EmployeeList) ---------------------
const TIERS = [
    { label: 'Tech Consultant',     rank: 100, icon: Crown,      gradient: 'from-amber-400 to-orange-500',   ring: 'ring-amber-300',  glow: 'shadow-amber-200',  match: (t: string) => /tech consultant|consultant/i.test(t) },
    { label: 'Tech Lead',           rank: 90,  icon: Crown,      gradient: 'from-violet-500 to-fuchsia-600', ring: 'ring-violet-300', glow: 'shadow-violet-200', match: (t: string) => /tech lead|team lead/i.test(t) },
    { label: 'Senior',              rank: 80,  icon: Star,       gradient: 'from-indigo-500 to-blue-600',    ring: 'ring-indigo-300', glow: 'shadow-indigo-200', match: (t: string) => /senior|sde\s*[-\s]?(ii|2)/i.test(t) },
    { label: 'Engineer',            rank: 70,  icon: Briefcase,  gradient: 'from-sky-500 to-cyan-600',       ring: 'ring-sky-300',    glow: 'shadow-sky-200',    match: (t: string) => /sde|software development engineer|front-?end|devops/i.test(t) },
    { label: 'Business Analyst',    rank: 60,  icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600',   ring: 'ring-emerald-300',glow: 'shadow-emerald-200',match: (t: string) => /business analyst/i.test(t) },
    { label: 'QA',                  rank: 55,  icon: Briefcase,  gradient: 'from-rose-500 to-pink-600',      ring: 'ring-rose-300',   glow: 'shadow-rose-200',   match: (t: string) => /qa|test engineer/i.test(t) },
    { label: 'Designer',            rank: 50,  icon: Sparkles,   gradient: 'from-pink-500 to-rose-600',      ring: 'ring-pink-300',   glow: 'shadow-pink-200',   match: (t: string) => /ui|ux|designer/i.test(t) },
    { label: 'Support',             rank: 30,  icon: Users,      gradient: 'from-slate-500 to-slate-700',    ring: 'ring-slate-300',  glow: 'shadow-slate-200',  match: (t: string) => /support|ticketing/i.test(t) },
    { label: 'Team',                rank: 0,   icon: Users,      gradient: 'from-slate-400 to-slate-500',    ring: 'ring-slate-300',  glow: 'shadow-slate-200',  match: () => true },
] as const;

const tierFor = (designation: string) => TIERS.find(t => t.match(designation)) ?? TIERS[TIERS.length - 1];

// ---------- Custom node ---------------------------------------------------
type EmpNodeData = {
    employee: Employee;
    directReports: number;
    totalSubordinates: number;
    dimmed: boolean;
    highlighted: boolean;
    onOpen: (e: Employee) => void;
};

function EmployeeNode({ data }: NodeProps<Node<EmpNodeData>>) {
    const { employee, directReports, totalSubordinates, dimmed, highlighted, onOpen } = data;
    const tier = tierFor(employee.designation || '');
    const Icon = tier.icon;
    const initials = `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: dimmed ? 0.25 : 1, scale: highlighted ? 1.06 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className={`relative ${highlighted ? 'z-10' : ''}`}
        >
            <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border-0" />

            <button
                onClick={() => onOpen(employee)}
                className={`group w-[220px] rounded-2xl bg-white border ${highlighted ? 'border-indigo-400 ring-4 ring-indigo-200/60' : 'border-slate-200'} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left`}
            >
                {/* Accent header */}
                <div className={`h-1.5 bg-gradient-to-r ${tier.gradient}`} />
                <div className="p-3">
                    <div className="flex items-center gap-3">
                        <div className={`relative shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${tier.gradient} text-white flex items-center justify-center shadow-lg ${tier.glow} font-bold text-sm`}>
                            {initials || <Icon className="w-5 h-5" />}
                            {directReports > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-white text-[10px] font-bold text-slate-700 rounded-full px-1.5 py-0.5 shadow border border-slate-200">
                                    {directReports}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{employee.designation}</div>
                        </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gradient-to-br ${tier.gradient} text-white`}>
                            <Icon className="w-3 h-3" /> {tier.label}
                        </span>
                        {employee.department && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-[110px]" title={employee.department}>
                                {employee.department}
                            </span>
                        )}
                        {totalSubordinates > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700">
                                {totalSubordinates} reports
                            </span>
                        )}
                    </div>
                </div>
            </button>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-0" />
        </motion.div>
    );
}

const nodeTypes = { employee: EmployeeNode };

// ---------- Auto-layout with dagre ---------------------------------------
const NODE_W = 220;
const NODE_H = 110;

function layoutNodes(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, nodesep: 48, ranksep: 90, marginx: 40, marginy: 40 });

    nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
    edges.forEach(e => g.setEdge(e.source, e.target));
    dagre.layout(g);

    const laid = nodes.map(n => {
        const pos = g.node(n.id);
        return {
            ...n,
            targetPosition: direction === 'LR' ? Position.Left : Position.Top,
            sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
            position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
        } as Node;
    });
    return laid;
}

// ---------- Main inner component (inside provider) -----------------------
function OrgFlowInner() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Employee | null>(null);
    const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<EmpNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const rf = useReactFlow();
    const containerRef = useRef<HTMLDivElement>(null);

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const data = await employeeApi.getAll();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[OrgFlow] load failed', err);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);

    // Precompute direct-report counts and total subordinates per employee
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
        const totalCache = new Map<string, number>();
        const totalFor = (id: string): number => {
            if (totalCache.has(id)) return totalCache.get(id)!;
            const kids = children.get(id) ?? [];
            let n = kids.length;
            for (const k of kids) n += totalFor(k);
            totalCache.set(id, n);
            return n;
        };
        return { direct, totalFor };
    }, [employees]);

    // Search highlight + ancestor path
    const { highlightedIds, matchIds } = useMemo(() => {
        if (!search.trim()) return { highlightedIds: new Set<string>(), matchIds: new Set<string>() };
        const q = search.toLowerCase();
        const matches = employees.filter(e =>
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
            e.designation?.toLowerCase().includes(q) ||
            e.department?.toLowerCase().includes(q)
        );
        const matchSet = new Set(matches.map(m => m.id));
        const highlight = new Set<string>(matchSet);
        const byId = new Map(employees.map(e => [e.id, e]));
        // include ancestors so context is preserved
        for (const m of matches) {
            let cur = m.reportingManagerId;
            while (cur) {
                if (highlight.has(cur)) break;
                highlight.add(cur);
                cur = byId.get(cur)?.reportingManagerId ?? null;
            }
        }
        return { highlightedIds: highlight, matchIds: matchSet };
    }, [employees, search]);

    // Build nodes + edges
    useEffect(() => {
        if (!employees.length) { setNodes([]); setEdges([]); return; }

        const empNodes: Node<EmpNodeData>[] = employees.map(e => {
            const dimmed = search.trim().length > 0 && !highlightedIds.has(e.id);
            const isMatch = matchIds.has(e.id);
            return {
                id: e.id,
                type: 'employee',
                position: { x: 0, y: 0 },
                data: {
                    employee: e,
                    directReports: reportIndex.direct.get(e.id) ?? 0,
                    totalSubordinates: reportIndex.totalFor(e.id),
                    dimmed,
                    highlighted: isMatch,
                    onOpen: (emp) => setSelected(emp),
                },
            };
        });

        const empEdges: Edge[] = employees
            .filter(e => e.reportingManagerId && employees.some(p => p.id === e.reportingManagerId))
            .map(e => {
                const endpointsMatch = highlightedIds.has(e.id) && highlightedIds.has(e.reportingManagerId!);
                const anySearch = search.trim().length > 0;
                return {
                    id: `${e.reportingManagerId}->${e.id}`,
                    source: e.reportingManagerId!,
                    target: e.id,
                    type: 'smoothstep',
                    animated: endpointsMatch,
                    style: {
                        stroke: anySearch && !endpointsMatch ? '#e2e8f0' : '#94a3b8',
                        strokeWidth: endpointsMatch ? 2.2 : 1.4,
                        opacity: anySearch && !endpointsMatch ? 0.25 : 1,
                    },
                    markerEnd: { type: MarkerType.ArrowClosed, color: endpointsMatch ? '#6366f1' : '#94a3b8' },
                };
            });

        const laidOut = layoutNodes(empNodes, empEdges, direction);
        setNodes(laidOut as Node<EmpNodeData>[]);
        setEdges(empEdges);

        // Fit view after layout settles
        setTimeout(() => rf.fitView({ padding: 0.2, duration: 600 }), 50);
    }, [employees, reportIndex, highlightedIds, matchIds, search, direction, setNodes, setEdges, rf]);

    // Focus camera on first match whenever search changes
    useEffect(() => {
        if (!search.trim() || matchIds.size === 0) return;
        const firstId = Array.from(matchIds)[0];
        const node = nodes.find(n => n.id === firstId);
        if (node) rf.setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, { zoom: 1.1, duration: 600 });
    }, [matchIds, nodes, rf, search]);

    // Stats
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
        if (!document.fullscreenElement) el.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Header */}
            <div className="shrink-0 px-6 pt-5 pb-3 border-b border-slate-200/70 bg-white/80 backdrop-blur">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                            <Network className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Organization Chart</h1>
                            <p className="text-xs text-slate-500">Interactive graph · scroll to zoom · drag to pan · click a node for details</p>
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
                        <Button variant="outline" size="sm" onClick={() => rf.fitView({ padding: 0.2, duration: 500 })}>
                            <Focus className="w-4 h-4 mr-1.5" /> Fit
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleFullscreen}>
                            <Maximize2 className="w-4 h-4 mr-1.5" /> Fullscreen
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadEmployees} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats + search */}
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
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        minZoom={0.1}
                        maxZoom={2.5}
                        defaultEdgeOptions={{ type: 'smoothstep' }}
                        proOptions={{ hideAttribution: true }}
                        nodesDraggable
                        nodesConnectable={false}
                        elementsSelectable
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1.3} color="#cbd5e1" />
                        <Controls position="bottom-right" showInteractive={false} className="!bg-white !border !border-slate-200 !rounded-xl !shadow-md" />
                        <MiniMap
                            position="bottom-left"
                            pannable
                            zoomable
                            className="!bg-white !border !border-slate-200 !rounded-xl !shadow-md"
                            nodeColor={(n) => {
                                const emp = (n.data as EmpNodeData | undefined)?.employee;
                                if (!emp) return '#cbd5e1';
                                const tier = tierFor(emp.designation || '');
                                // pick a representative color from gradient family
                                if (tier.rank >= 100) return '#f59e0b';
                                if (tier.rank >= 90) return '#8b5cf6';
                                if (tier.rank >= 80) return '#6366f1';
                                if (tier.rank >= 70) return '#0ea5e9';
                                if (tier.rank >= 60) return '#10b981';
                                if (tier.rank >= 55) return '#f43f5e';
                                if (tier.rank >= 50) return '#ec4899';
                                return '#64748b';
                            }}
                            maskColor="rgba(15,23,42,0.06)"
                        />
                    </ReactFlow>
                )}
            </div>

            {/* Details drawer */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                        className="absolute top-0 right-0 h-full w-[360px] bg-white border-l border-slate-200 shadow-2xl z-20 flex flex-col"
                    >
                        <EmployeeDetails employee={selected} onClose={() => setSelected(null)} reportsCount={reportIndex.direct.get(selected.id) ?? 0} totalSubs={reportIndex.totalFor(selected.id)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

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
    const projects = (employee.teamMemberships ?? []).reduce<Map<string, { name: string; alloc: number }>>((acc, tm) => {
        const p = tm.team?.project;
        if (!p) return acc;
        const existing = acc.get(p.id);
        if (existing) existing.alloc += tm.allocationPercentage ?? 0;
        else acc.set(p.id, { name: p.name, alloc: tm.allocationPercentage ?? 0 });
        return acc;
    }, new Map());

    return (
        <div className="flex flex-col h-full">
            <div className={`bg-gradient-to-br ${tier.gradient} text-white p-6 relative`}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition">
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
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Allocated projects</div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from(projects.values()).map((p, i) => (
                                <span key={i} className="px-2 py-1 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
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

// ---------- Exported wrapper ---------------------------------------------
export default function OrgFlowChart() {
    return (
        <ReactFlowProvider>
            <OrgFlowInner />
        </ReactFlowProvider>
    );
}
