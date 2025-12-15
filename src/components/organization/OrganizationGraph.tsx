/**
 * Organization Graph View with Drag-Drop
 * Interactive graph visualization similar to Resource Allocation HierarchyView
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useSensor,
    useSensors,
    PointerSensor,
    useDroppable,
    useDraggable,
    closestCenter,
} from '@dnd-kit/core';
import { employeeApi } from '@/services/api';
import {
    Building2,
    Users,
    User,
    ChevronDown,
    ChevronRight,
    Crown,
    Shield,
    UserCircle,
    Search,
    RefreshCw,
    Loader2,
    GripVertical,
    Briefcase,
    Mail,
    Phone,
    Network,
    LayoutList,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Move
} from 'lucide-react';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
    department: string;
    reportingManagerId: string | null;
    avatar?: string;
    phone?: string;
    isActive: boolean;
}

interface HierarchyNode {
    employee: Employee;
    children: HierarchyNode[];
    level: number;
}

// Graph Node Component
function GraphNode({ 
    employee, 
    level, 
    isDropTarget,
    childCount 
}: { 
    employee: Employee; 
    level: number;
    isDropTarget?: boolean;
    childCount: number;
}) {
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: employee.id,
        data: { employee }
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `drop-${employee.id}`,
        data: { managerId: employee.id }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
    } : undefined;

    const getLevelConfig = () => {
        if (level === 0) return { 
            icon: Crown, 
            gradient: 'from-amber-500 to-orange-500',
            ring: 'ring-amber-200',
            bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
            border: 'border-amber-200',
            badge: 'CEO',
            badgeClass: 'bg-amber-100 text-amber-700'
        };
        if (level === 1) return { 
            icon: Shield, 
            gradient: 'from-indigo-500 to-violet-500',
            ring: 'ring-indigo-200',
            bg: 'bg-gradient-to-br from-indigo-50 to-violet-50',
            border: 'border-indigo-200',
            badge: 'Lead',
            badgeClass: 'bg-indigo-100 text-indigo-700'
        };
        return { 
            icon: UserCircle, 
            gradient: 'from-slate-500 to-slate-600',
            ring: 'ring-slate-200',
            bg: 'bg-white',
            border: 'border-slate-200',
            badge: 'Member',
            badgeClass: 'bg-slate-100 text-slate-600'
        };
    };

    const config = getLevelConfig();
    const IconComponent = config.icon;

    return (
        <div className="flex flex-col items-center" style={style}>
            <div
                ref={(node) => {
                    setDragRef(node);
                    setDropRef(node);
                }}
                className={`
                    relative group cursor-grab active:cursor-grabbing transition-all duration-200
                    ${isDragging ? 'opacity-50 scale-105' : ''}
                    ${isOver || isDropTarget ? 'scale-105' : ''}
                `}
                {...attributes}
                {...listeners}
            >
                {/* Drop indicator */}
                {(isOver || isDropTarget) && (
                    <div className="absolute -inset-2 bg-indigo-100 rounded-2xl animate-pulse" />
                )}
                
                {/* Card */}
                <div className={`
                    relative ${config.bg} rounded-xl border-2 ${config.border} 
                    p-4 min-w-[180px] max-w-[200px] shadow-lg hover:shadow-xl
                    transition-all duration-200 ${isOver ? 'border-indigo-400 ring-4 ring-indigo-100' : ''}
                `}>
                    {/* Drag handle */}
                    <div className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-3 h-3 text-slate-400" />
                    </div>

                    {/* Avatar */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`relative mb-3 ring-4 ${config.ring} rounded-full`}>
                            <Avatar className="h-16 w-16 border-2 border-white">
                                <AvatarImage src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${employee.firstName} ${employee.lastName}`)}&background=random&size=128`} />
                                <AvatarFallback className={`bg-gradient-to-br ${config.gradient} text-white text-lg font-bold`}>
                                    {employee.firstName[0]}{employee.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 p-1.5 bg-gradient-to-br ${config.gradient} rounded-full shadow-lg`}>
                                <IconComponent className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        {/* Info */}
                        <h4 className="font-bold text-slate-900 text-sm truncate w-full">
                            {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="text-xs text-slate-500 truncate w-full mb-2">
                            {employee.designation}
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <Badge className={`${config.badgeClass} text-[10px] px-2 py-0`}>
                                {config.badge}
                            </Badge>
                            {childCount > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white">
                                    <Users className="w-2.5 h-2.5 mr-0.5" />
                                    {childCount}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tree rendering with connectors
function OrgTreeNode({ 
    node, 
    activeDropId,
    isRoot = false 
}: { 
    node: HierarchyNode;
    activeDropId: string | null;
    isRoot?: boolean;
}) {
    const isDropTarget = activeDropId === `drop-${node.employee.id}`;
    const hasChildren = node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Node */}
            <GraphNode 
                employee={node.employee} 
                level={node.level}
                isDropTarget={isDropTarget}
                childCount={node.children.length}
            />

            {/* Vertical connector to children */}
            {hasChildren && (
                <>
                    <div className="w-0.5 h-8 bg-gradient-to-b from-slate-300 to-slate-200" />
                    
                    {/* Horizontal connector */}
                    {node.children.length > 1 && (
                        <div 
                            className="h-0.5 bg-slate-200 relative"
                            style={{ 
                                width: `calc(${(node.children.length - 1) * 220}px)` 
                            }}
                        />
                    )}

                    {/* Children */}
                    <div className="flex gap-8 mt-0">
                        {node.children.map((child, idx) => (
                            <div key={child.employee.id} className="flex flex-col items-center">
                                {/* Vertical line from horizontal connector */}
                                <div className="w-0.5 h-8 bg-slate-200" />
                                <OrgTreeNode 
                                    node={child} 
                                    activeDropId={activeDropId}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function OrganizationGraph() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
    const [activeDropId, setActiveDropId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        })
    );

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const data = await employeeApi.getAll();
            if (data && data.length > 0) {
                setEmployees(data);
            } else {
                // Demo data
                setEmployees(getDemoEmployees());
            }
        } catch (error) {
            console.error('Failed to load employees:', error);
            setEmployees(getDemoEmployees());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const getDemoEmployees = (): Employee[] => [
        { id: 'ceo-1', firstName: 'Vikram', lastName: 'Mehta', email: 'vikram@allocx.com', designation: 'Chief Executive Officer', department: 'Executive', reportingManagerId: null, isActive: true },
        { id: 'cto-1', firstName: 'Arjun', lastName: 'Kapoor', email: 'arjun@allocx.com', designation: 'Chief Technology Officer', department: 'Technology', reportingManagerId: 'ceo-1', isActive: true },
        { id: 'coo-1', firstName: 'Priya', lastName: 'Sharma', email: 'priya@allocx.com', designation: 'Chief Operating Officer', department: 'Operations', reportingManagerId: 'ceo-1', isActive: true },
        { id: 'tl-1', firstName: 'Rahul', lastName: 'Singh', email: 'rahul@allocx.com', designation: 'Engineering Lead', department: 'Engineering', reportingManagerId: 'cto-1', isActive: true },
        { id: 'tl-2', firstName: 'Sneha', lastName: 'Patel', email: 'sneha@allocx.com', designation: 'Design Lead', department: 'Design', reportingManagerId: 'cto-1', isActive: true },
        { id: 'tl-3', firstName: 'Karan', lastName: 'Joshi', email: 'karan@allocx.com', designation: 'Operations Lead', department: 'Operations', reportingManagerId: 'coo-1', isActive: true },
        { id: 'emp-1', firstName: 'Aisha', lastName: 'Khan', email: 'aisha@allocx.com', designation: 'Senior Developer', department: 'Engineering', reportingManagerId: 'tl-1', isActive: true },
        { id: 'emp-2', firstName: 'Rohan', lastName: 'Verma', email: 'rohan@allocx.com', designation: 'Backend Developer', department: 'Engineering', reportingManagerId: 'tl-1', isActive: true },
        { id: 'emp-3', firstName: 'Meera', lastName: 'Iyer', email: 'meera@allocx.com', designation: 'Frontend Developer', department: 'Engineering', reportingManagerId: 'tl-1', isActive: true },
        { id: 'emp-4', firstName: 'Divya', lastName: 'Reddy', email: 'divya@allocx.com', designation: 'UI Designer', department: 'Design', reportingManagerId: 'tl-2', isActive: true },
        { id: 'emp-5', firstName: 'Nikhil', lastName: 'Nair', email: 'nikhil@allocx.com', designation: 'UX Researcher', department: 'Design', reportingManagerId: 'tl-2', isActive: true },
        { id: 'emp-6', firstName: 'Ananya', lastName: 'Das', email: 'ananya@allocx.com', designation: 'Operations Manager', department: 'Operations', reportingManagerId: 'tl-3', isActive: true },
    ];

    // Build hierarchy tree
    const buildHierarchy = useCallback((): HierarchyNode[] => {
        const employeeMap = new Map<string, Employee>();
        const childrenMap = new Map<string, Employee[]>();

        const filteredEmployees = search 
            ? employees.filter(emp => {
                const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                return fullName.includes(search.toLowerCase()) || 
                       emp.designation.toLowerCase().includes(search.toLowerCase()) ||
                       emp.department.toLowerCase().includes(search.toLowerCase());
            })
            : employees;

        filteredEmployees.forEach(emp => {
            employeeMap.set(emp.id, emp);
            const parentKey = emp.reportingManagerId || 'root';
            if (!childrenMap.has(parentKey)) {
                childrenMap.set(parentKey, []);
            }
            childrenMap.get(parentKey)!.push(emp);
        });

        const buildNode = (employee: Employee, level: number): HierarchyNode => {
            const children = (childrenMap.get(employee.id) || [])
                .map(child => buildNode(child, level + 1));
            return { employee, children, level };
        };

        const roots = childrenMap.get('root') || [];
        return roots.map(root => buildNode(root, 0));
    }, [employees, search]);

    const handleDragStart = (event: DragStartEvent) => {
        const employee = event.active.data.current?.employee as Employee;
        setActiveEmployee(employee);
    };

    const handleDragOver = (event: any) => {
        const { over } = event;
        setActiveDropId(over?.id ? String(over.id) : null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveEmployee(null);
        setActiveDropId(null);

        if (!over) return;

        const employeeId = String(active.id);
        const targetId = String(over.id);

        if (!targetId.startsWith('drop-')) return;
        const newManagerId = targetId.replace('drop-', '');

        if (employeeId === newManagerId) return;

        // Prevent circular reference
        const isDescendant = (parentId: string, childId: string): boolean => {
            const children = employees.filter(e => e.reportingManagerId === parentId);
            for (const child of children) {
                if (child.id === childId || isDescendant(child.id, childId)) {
                    return true;
                }
            }
            return false;
        };

        if (isDescendant(employeeId, newManagerId)) {
            alert('Cannot move an employee under their own subordinate');
            return;
        }

        try {
            await employeeApi.update(employeeId, { reportingManagerId: newManagerId });
            setEmployees(prev => prev.map(emp => 
                emp.id === employeeId ? { ...emp, reportingManagerId: newManagerId } : emp
            ));
        } catch (error) {
            console.error('Failed to update:', error);
            setEmployees(prev => prev.map(emp => 
                emp.id === employeeId ? { ...emp, reportingManagerId: newManagerId } : emp
            ));
        }
    };

    const hierarchy = buildHierarchy();

    const stats = {
        total: employees.length,
        executives: employees.filter(e => !e.reportingManagerId).length,
        leads: employees.filter(e => {
            return e.reportingManagerId && employees.some(emp => emp.reportingManagerId === e.id);
        }).length,
        members: employees.filter(e => {
            return e.reportingManagerId && !employees.some(emp => emp.reportingManagerId === e.id);
        }).length,
    };

    // Zoom utilities
    const MIN_ZOOM = 0.4;
    const MAX_ZOOM = 2.5;

    const clampZoom = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));

    const fitToScreen = () => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        // natural content size (unscaled)
        const contentW = content.scrollWidth;
        const contentH = content.scrollHeight;

        const availableW = container.clientWidth - 32; // some padding
        const availableH = container.clientHeight - 32;

        if (contentW === 0 || contentH === 0) {
            setZoom(1);
            return;
        }

        const scaleW = availableW / contentW;
        const scaleH = availableH / contentH;
        const target = clampZoom(Math.min(scaleW, scaleH, 1.0));
        setZoom(target);

        // center content after a tick
        requestAnimationFrame(() => {
            // scaled sizes
            const scaledW = contentW * target;
            const scaledH = contentH * target;
            container.scrollLeft = Math.max(0, (scaledW - container.clientWidth) / 2);
            container.scrollTop = Math.max(0, (scaledH - container.clientHeight) / 2);
        });
    };

    // Wheel zoom (Ctrl + wheel) for desktop
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            // Only zoom when ctrlKey or metaKey is pressed to avoid interfering with scroll
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const delta = -e.deltaY;
            const step = 0.0015 * Math.abs(delta) + 0.05;
            const newZoom = clampZoom(zoom + (delta > 0 ? step : -step));
            setZoom(newZoom);

            // center after zoom
            requestAnimationFrame(() => {
                const content = contentRef.current;
                if (!content) return;
                const scaledW = content.scrollWidth * newZoom;
                const scaledH = content.scrollHeight * newZoom;
                container.scrollLeft = Math.max(0, (scaledW - container.clientWidth) / 2);
                container.scrollTop = Math.max(0, (scaledH - container.clientHeight) / 2);
            });
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, [zoom]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-6 py-4 sticky top-0 z-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Network className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-slate-900">Organization Chart</h2>
                                <p className="text-xs md:text-sm text-slate-500">Drag to reorganize • Click to view details</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* View Toggle */}
                            <div className="hidden md:flex bg-slate-100 rounded-lg p-1">
                                <Button
                                    variant={viewMode === 'graph' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('graph')}
                                    className="h-8"
                                >
                                    <Network className="w-4 h-4 mr-1" />
                                    Graph
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="h-8"
                                >
                                    <LayoutList className="w-4 h-4 mr-1" />
                                    List
                                </Button>
                            </div>

                            {/* Zoom Controls */}
                            {viewMode === 'graph' && (
                                <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs font-medium text-slate-600 w-12 text-center">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setZoom(1)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={loadEmployees}
                                disabled={loading}
                                size="sm"
                                className="h-8 md:h-9"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                <span className="hidden md:inline ml-2">Refresh</span>
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4">
                        <div className="bg-slate-50 rounded-lg p-2 md:p-3 border border-slate-200">
                            <div className="flex items-center gap-1 md:gap-2">
                                <Users className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                                <span className="text-lg md:text-2xl font-bold text-slate-900">{stats.total}</span>
                            </div>
                            <p className="text-[10px] md:text-xs text-slate-500">Total</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2 md:p-3 border border-amber-200">
                            <div className="flex items-center gap-1 md:gap-2">
                                <Crown className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                                <span className="text-lg md:text-2xl font-bold text-amber-700">{stats.executives}</span>
                            </div>
                            <p className="text-[10px] md:text-xs text-amber-600">Executives</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-2 md:p-3 border border-indigo-200">
                            <div className="flex items-center gap-1 md:gap-2">
                                <Shield className="w-3 h-3 md:w-4 md:h-4 text-indigo-600" />
                                <span className="text-lg md:text-2xl font-bold text-indigo-700">{stats.leads}</span>
                            </div>
                            <p className="text-[10px] md:text-xs text-indigo-600">Leads</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2 md:p-3 border border-emerald-200">
                            <div className="flex items-center gap-1 md:gap-2">
                                <User className="w-3 h-3 md:w-4 md:h-4 text-emerald-600" />
                                <span className="text-lg md:text-2xl font-bold text-emerald-700">{stats.members}</span>
                            </div>
                            <p className="text-[10px] md:text-xs text-emerald-600">Members</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, role, or department..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200 h-9 md:h-10"
                        />
                    </div>
                </div>

                {/* Graph View */}
                <div 
                    ref={containerRef}
                    className="flex-1 overflow-auto"
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                <p className="text-slate-500">Loading organization...</p>
                            </div>
                        </div>
                    ) : hierarchy.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <Building2 className="w-20 h-20 text-slate-200 mb-4" />
                            <h3 className="font-bold text-slate-900 text-lg mb-2">No Organization Data</h3>
                            <p className="text-slate-500 max-w-md">
                                {search ? 'No employees match your search criteria.' : 'Add employees to build your organization chart.'}
                            </p>
                        </div>
                    ) : (
                        <div 
                            className="min-h-full p-8 md:p-12"
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                        >
                            <div ref={contentRef} className="flex flex-col items-center min-w-max">
                                {/* Company Name Header */}
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-indigo-200/50">
                                        <Building2 className="w-5 h-5" />
                                        <span className="font-bold text-lg">AllocateX Organization</span>
                                    </div>
                                    <div className="mt-2 w-0.5 h-8 bg-slate-300 mx-auto" />
                                </div>

                                {/* Tree */}
                                <div className="flex gap-16">
                                    {hierarchy.map((node) => (
                                        <OrgTreeNode
                                            key={node.employee.id}
                                            node={node}
                                            activeDropId={activeDropId}
                                            isRoot
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeEmployee && (
                        <div className="shadow-2xl rounded-xl">
                            <div className={`
                                bg-white rounded-xl border-2 border-indigo-400 
                                p-4 min-w-[180px] shadow-2xl
                            `}>
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-14 w-14 mb-2 ring-4 ring-indigo-200">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg font-bold">
                                            {activeEmployee.firstName[0]}{activeEmployee.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        {activeEmployee.firstName} {activeEmployee.lastName}
                                    </h4>
                                    <p className="text-xs text-slate-500">{activeEmployee.designation}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
