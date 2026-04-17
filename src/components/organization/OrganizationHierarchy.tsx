/**
 * Organization Hierarchy Tree with Drag-Drop
 * Displays company structure with CEO → Team Leads → Team Members
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Phone
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

// Draggable Employee Card
function DraggableEmployee({ employee, level }: { employee: Employee; level: number }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: employee.id,
        data: { employee }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    const getLevelIcon = () => {
        if (level === 0) return <Crown className="w-4 h-4 text-amber-500" />;
        if (level === 1) return <Shield className="w-4 h-4 text-indigo-500" />;
        return <UserCircle className="w-4 h-4 text-slate-400" />;
    };

    const getLevelBadge = () => {
        if (level === 0) return { label: 'CEO', className: 'bg-amber-100 text-amber-700 border-amber-200' };
        if (level === 1) return { label: 'Team Lead', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
        return { label: 'Member', className: 'bg-slate-100 text-slate-600 border-slate-200' };
    };

    const badge = getLevelBadge();

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-lg ring-2 ring-indigo-400' : ''}`}
            {...attributes}
            {...listeners}
        >
            <div className="p-1 text-slate-300 group-hover:text-slate-500">
                <GripVertical className="w-4 h-4" />
            </div>
            
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                <AvatarImage src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${employee.firstName} ${employee.lastName}`)}&background=random`} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold">
                    {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 truncate">
                        {employee.firstName} {employee.lastName}
                    </h4>
                    {getLevelIcon()}
                </div>
                <p className="text-sm text-slate-500 truncate">{employee.designation}</p>
            </div>

            <Badge className={`${badge.className} border text-xs flex-shrink-0`}>
                {badge.label}
            </Badge>
        </div>
    );
}

// Droppable Container for Team Lead
function DroppableTeamContainer({ employee, children, isOver }: { employee: Employee; children: React.ReactNode; isOver?: boolean }) {
    const { setNodeRef } = useDroppable({
        id: `team-${employee.id}`,
        data: { managerId: employee.id }
    });

    return (
        <div
            ref={setNodeRef}
            className={`ml-8 mt-2 p-3 rounded-xl border-2 border-dashed transition-all min-h-[60px] ${
                isOver 
                    ? 'border-indigo-400 bg-indigo-50' 
                    : 'border-slate-200 bg-slate-50/50'
            }`}
        >
            {children}
        </div>
    );
}

// Hierarchy Node Component
function HierarchyNodeComponent({ 
    node, 
    expandedNodes, 
    toggleNode,
    activeDropId
}: { 
    node: HierarchyNode; 
    expandedNodes: Set<string>;
    toggleNode: (id: string) => void;
    activeDropId: string | null;
}) {
    const isExpanded = expandedNodes.has(node.employee.id);
    const hasChildren = node.children.length > 0;
    const isDropTarget = activeDropId === `team-${node.employee.id}`;

    return (
        <div className="relative">
            {/* Connection Line */}
            {node.level > 0 && (
                <div className="absolute left-0 top-0 w-6 h-8 border-l-2 border-b-2 border-slate-200 rounded-bl-lg -translate-x-3" />
            )}

            {/* Node Content */}
            <div className="flex items-start gap-2">
                {hasChildren && (
                    <button
                        onClick={() => toggleNode(node.employee.id)}
                        className="mt-3 p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                )}
                {!hasChildren && <div className="w-6" />}

                <div className="flex-1">
                    <DraggableEmployee employee={node.employee} level={node.level} />

                    {/* Children Container */}
                    {(isExpanded || node.level < 2) && (
                        <DroppableTeamContainer employee={node.employee} isOver={isDropTarget}>
                            {node.children.length > 0 ? (
                                <div className="space-y-3">
                                    {node.children.map((child) => (
                                        <HierarchyNodeComponent
                                            key={child.employee.id}
                                            node={child}
                                            expandedNodes={expandedNodes}
                                            toggleNode={toggleNode}
                                            activeDropId={activeDropId}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-2">
                                    Drop team members here
                                </p>
                            )}
                        </DroppableTeamContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function OrganizationHierarchy() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
    const [activeDropId, setActiveDropId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const data = await employeeApi.getAll();
            setEmployees(data || []);
            
            // Auto-expand first 2 levels
            const toExpand = new Set<string>();
            data.forEach((emp: Employee) => {
                if (!emp.reportingManagerId) {
                    toExpand.add(emp.id);
                }
            });
            setExpandedNodes(toExpand);
        } catch (error) {
            console.error('Failed to load employees:', error);
            // Demo data
            const demoEmployees: Employee[] = [
                { id: 'ceo-1', firstName: 'Vikram', lastName: 'Mehta', email: 'vikram@allocx.com', designation: 'Chief Executive Officer', department: 'Executive', reportingManagerId: null, isActive: true },
                { id: 'tl-1', firstName: 'Priya', lastName: 'Sharma', email: 'priya@allocx.com', designation: 'Engineering Lead', department: 'Engineering', reportingManagerId: 'ceo-1', isActive: true },
                { id: 'tl-2', firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh@allocx.com', designation: 'Design Lead', department: 'Design', reportingManagerId: 'ceo-1', isActive: true },
                { id: 'tl-3', firstName: 'Anita', lastName: 'Desai', email: 'anita@allocx.com', designation: 'Product Lead', department: 'Product', reportingManagerId: 'ceo-1', isActive: true },
                { id: 'emp-1', firstName: 'Rahul', lastName: 'Singh', email: 'rahul@allocx.com', designation: 'Senior Developer', department: 'Engineering', reportingManagerId: 'tl-1', isActive: true },
                { id: 'emp-2', firstName: 'Sneha', lastName: 'Patel', email: 'sneha@allocx.com', designation: 'Frontend Developer', department: 'Engineering', reportingManagerId: 'tl-1', isActive: true },
                { id: 'emp-3', firstName: 'Arjun', lastName: 'Nair', email: 'arjun@allocx.com', designation: 'Backend Developer', department: 'Engineering', reportingManagerId: 'tl-1', isActive: true },
                { id: 'emp-4', firstName: 'Meera', lastName: 'Iyer', email: 'meera@allocx.com', designation: 'UI Designer', department: 'Design', reportingManagerId: 'tl-2', isActive: true },
                { id: 'emp-5', firstName: 'Karan', lastName: 'Joshi', email: 'karan@allocx.com', designation: 'UX Researcher', department: 'Design', reportingManagerId: 'tl-2', isActive: true },
                { id: 'emp-6', firstName: 'Divya', lastName: 'Reddy', email: 'divya@allocx.com', designation: 'Product Manager', department: 'Product', reportingManagerId: 'tl-3', isActive: true },
            ];
            setEmployees(demoEmployees);
            setExpandedNodes(new Set(['ceo-1', 'tl-1', 'tl-2', 'tl-3']));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    // Build hierarchy tree
    const buildHierarchy = useCallback((): HierarchyNode[] => {
        const employeeMap = new Map<string, Employee>();
        const childrenMap = new Map<string, Employee[]>();

        employees.forEach(emp => {
            employeeMap.set(emp.id, emp);
            if (!childrenMap.has(emp.reportingManagerId || 'root')) {
                childrenMap.set(emp.reportingManagerId || 'root', []);
            }
            childrenMap.get(emp.reportingManagerId || 'root')!.push(emp);
        });

        const buildNode = (employee: Employee, level: number): HierarchyNode => {
            const children = (childrenMap.get(employee.id) || [])
                .filter(emp => {
                    if (!search) return true;
                    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                    return fullName.includes(search.toLowerCase()) || 
                           emp.designation.toLowerCase().includes(search.toLowerCase()) ||
                           emp.department.toLowerCase().includes(search.toLowerCase());
                })
                .map(child => buildNode(child, level + 1));

            return { employee, children, level };
        };

        const roots = childrenMap.get('root') || [];
        return roots.map(root => buildNode(root, 0));
    }, [employees, search]);

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const employee = active.data.current?.employee as Employee;
        setActiveEmployee(employee);
    };

    const handleDragOver = (event: any) => {
        const { over } = event;
        if (over?.id) {
            setActiveDropId(String(over.id));
        } else {
            setActiveDropId(null);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveEmployee(null);
        setActiveDropId(null);

        if (!over) return;

        const employeeId = String(active.id);
        const targetId = String(over.id);

        // Extract manager ID from droppable ID
        if (!targetId.startsWith('team-')) return;
        const newManagerId = targetId.replace('team-', '');

        if (employeeId === newManagerId) return;

        // Update employee's reporting manager
        try {
            await employeeApi.update(employeeId, { reportingManagerId: newManagerId });
            
            // Update local state
            setEmployees(prev => prev.map(emp => 
                emp.id === employeeId 
                    ? { ...emp, reportingManagerId: newManagerId }
                    : emp
            ));
        } catch (error) {
            console.error('Failed to update reporting manager:', error);
            // For demo, update locally anyway
            setEmployees(prev => prev.map(emp => 
                emp.id === employeeId 
                    ? { ...emp, reportingManagerId: newManagerId }
                    : emp
            ));
        }
    };

    const hierarchy = buildHierarchy();

    // Stats
    const stats = {
        total: employees.length,
        ceos: employees.filter(e => !e.reportingManagerId).length,
        teamLeads: employees.filter(e => {
            const hasReports = employees.some(emp => emp.reportingManagerId === e.id);
            return e.reportingManagerId && hasReports;
        }).length,
        members: employees.filter(e => {
            const hasReports = employees.some(emp => emp.reportingManagerId === e.id);
            return e.reportingManagerId && !hasReports;
        }).length,
    };

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
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Organization Hierarchy</h2>
                                <p className="text-sm text-slate-500">Drag and drop to reorganize team structure</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={loadEmployees}
                            disabled={loading}
                            className="h-9"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                            </div>
                            <p className="text-xs text-slate-500">Total Employees</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-amber-600" />
                                <span className="text-2xl font-bold text-amber-700">{stats.ceos}</span>
                            </div>
                            <p className="text-xs text-amber-600">Leadership</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-indigo-600" />
                                <span className="text-2xl font-bold text-indigo-700">{stats.teamLeads}</span>
                            </div>
                            <p className="text-xs text-indigo-600">Team Leads</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-emerald-600" />
                                <span className="text-2xl font-bold text-emerald-700">{stats.members}</span>
                            </div>
                            <p className="text-xs text-emerald-600">Team Members</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search employees by name, role, or department..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200"
                        />
                    </div>
                </div>

                {/* Hierarchy Tree */}
                <ScrollArea className="flex-1 px-6 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : hierarchy.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Building2 className="w-16 h-16 text-slate-300 mb-4" />
                            <h3 className="font-semibold text-slate-900 mb-1">No hierarchy found</h3>
                            <p className="text-sm text-slate-500">Add employees to build your organization structure</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {hierarchy.map((node) => (
                                <HierarchyNodeComponent
                                    key={node.employee.id}
                                    node={node}
                                    expandedNodes={expandedNodes}
                                    toggleNode={toggleNode}
                                    activeDropId={activeDropId}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeEmployee && (
                        <div className="w-80 shadow-2xl">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-indigo-400 shadow-lg">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold">
                                        {activeEmployee.firstName[0]}{activeEmployee.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900">
                                        {activeEmployee.firstName} {activeEmployee.lastName}
                                    </h4>
                                    <p className="text-sm text-slate-500">{activeEmployee.designation}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
