import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
import type { Project, ProjectRequirement } from '@/types/allocation';

export interface ManagerOption {
    id: string;
    name: string;
    designation?: string;
}

export interface ProjectFormValues {
    name: string;
    description?: string;
    managerId: string;
    startDate: string;
    endDate?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    requirements: ProjectRequirement[];
}

interface AddProjectDialogProps {
    project?: Project;
    managers?: ManagerOption[];
    onSubmit: (values: ProjectFormValues) => Promise<void> | void;
    trigger?: React.ReactNode;
}

const ROLE_LIBRARY = [
    'Senior Frontend Engineer',
    'Frontend Engineer',
    'Backend Lead',
    'Backend Engineer',
    'Full Stack Developer',
    'DevOps Engineer',
    'UI Designer',
    'UX Researcher',
    'Product Manager',
    'Scrum Master',
];

const PRIORITY_LABELS: Record<ProjectFormValues['priority'], string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
};

const PRIORITY_BADGE_CLASS: Record<ProjectFormValues['priority'], string> = {
    low: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    medium: 'border-amber-200 text-amber-700 bg-amber-50',
    high: 'border-orange-200 text-orange-700 bg-orange-50',
    critical: 'border-red-200 text-red-700 bg-red-50',
};

const formatDateForInput = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
};

export function AddProjectDialog({ project, managers = [], onSubmit, trigger }: AddProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialManagerId = useMemo(() => {
        if (project?.managerId) return project.managerId;
        return managers[0]?.id ?? '';
    }, [project?.managerId, managers]);

    const [form, setForm] = useState<ProjectFormValues>({
        name: project?.name || '',
        description: project?.description || '',
        managerId: initialManagerId,
        startDate: project?.startDate ? formatDateForInput(project.startDate) : new Date().toISOString().split('T')[0],
        endDate: project?.endDate ? formatDateForInput(project.endDate) : '',
        priority: project?.priority || 'medium',
        requirements: project?.requirements?.length ? project.requirements : [],
    });

    useEffect(() => {
        if (open) {
            setForm({
                name: project?.name || '',
                description: project?.description || '',
                managerId: project?.managerId || managers[0]?.id || '',
                startDate: project?.startDate ? formatDateForInput(project.startDate) : new Date().toISOString().split('T')[0],
                endDate: project?.endDate ? formatDateForInput(project.endDate) : '',
                priority: project?.priority || 'medium',
                requirements: project?.requirements?.length ? project.requirements : [],
            });
        }
    }, [open, project, managers]);

    const handleRequirementChange = (index: number, key: keyof ProjectRequirement, value: string | number) => {
        setForm((prev) => {
            const next = [...prev.requirements];
            next[index] = {
                ...next[index],
                [key]: key === 'count' ? Math.max(1, Number(value)) : value,
            };
            return { ...prev, requirements: next };
        });
    };

    const addRequirement = () => {
        setForm((prev) => ({
            ...prev,
            requirements: [...prev.requirements, { role: ROLE_LIBRARY[0], count: 1 }],
        }));
    };

    const removeRequirement = (index: number) => {
        setForm((prev) => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) return;
        if (managers.length > 0 && !form.managerId) return;

        try {
            setIsSubmitting(true);
            await onSubmit({
                ...form,
                name: form.name.trim(),
                requirements: form.requirements.filter((req) => req.role.trim()),
            });
            setOpen(false);
        } catch (error) {
            console.error('Project save failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeManager = managers.find((manager) => manager.id === form.managerId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700">
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[680px] max-h-[90vh] bg-white text-gray-900 border border-gray-200 shadow-xl p-0 overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                        {project ? 'Update Project' : 'Create Project'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        Define the delivery window, staffing needs, and ownership for this project.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
                    <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6">
                        <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="project-name" className="text-sm font-medium text-gray-700">Project Title</Label>
                            <Input
                                id="project-name"
                                value={form.name}
                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="E.g. Commerce Platform Revamp"
                                className="border-gray-300 focus-visible:ring-indigo-500"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="project-description" className="text-sm font-medium text-gray-700">Mission Brief</Label>
                            <Textarea
                                id="project-description"
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                placeholder="A short description of the outcomes, success metrics and focus areas."
                                className="border-gray-300 focus-visible:ring-indigo-500 min-h-[110px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-gray-700">Project Owner</Label>
                                <Select
                                    value={form.managerId}
                                    onValueChange={(value) => setForm((prev) => ({ ...prev, managerId: value }))}
                                    disabled={managers.length === 0}
                                >
                                    <SelectTrigger className="border-gray-300 focus:ring-indigo-500">
                                        <SelectValue placeholder="Select a manager" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                        {managers.map((manager) => (
                                            <SelectItem key={manager.id} value={manager.id} className="py-2">
                                                <div className="flex flex-col text-sm">
                                                    <span className="font-medium text-gray-900">{manager.name}</span>
                                                    {manager.designation && (
                                                        <span className="text-xs text-gray-500">{manager.designation}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {activeManager?.designation && (
                                    <p className="text-xs text-gray-500">{activeManager.designation}</p>
                                )}
                                {managers.length === 0 && (
                                    <p className="text-xs text-gray-500">Assigning a manager becomes available once employee data loads.</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-gray-700">Priority</Label>
                                <Select value={form.priority} onValueChange={(value: ProjectFormValues['priority']) => setForm((prev) => ({ ...prev, priority: value }))}>
                                    <SelectTrigger className="border-gray-300 focus:ring-indigo-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(PRIORITY_LABELS).map(([priority, label]) => (
                                            <SelectItem key={priority} value={priority}>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={PRIORITY_BADGE_CLASS[priority as ProjectFormValues['priority']]}
                                                    >
                                                        {label}
                                                    </Badge>
                                                    <span className="text-sm text-gray-700">{label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="project-start" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <CalendarPlus className="w-4 h-4 text-indigo-500" /> Start date
                                </Label>
                                <Input
                                    id="project-start"
                                    type="date"
                                    value={form.startDate}
                                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                                    className="border-gray-300 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="project-end" className="text-sm font-medium text-gray-700">Target completion</Label>
                                <Input
                                    id="project-end"
                                    type="date"
                                    value={form.endDate || ''}
                                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                                    className="border-gray-300 focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>
                        </div>

                        <Separator className="bg-gray-200" />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Role requirements</p>
                                    <p className="text-xs text-gray-500">Specify the skills mix and capacity the squad needs.</p>
                                </div>
                                <Button type="button" size="sm" variant="outline" onClick={addRequirement} className="gap-1 text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                                    <Plus className="w-3 h-3" /> Add role
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                {form.requirements.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-500">
                                        Add the target roles to drive better AI suggestions and resourcing matches.
                                    </div>
                                )}
                                {form.requirements.map((requirement, index) => (
                                    <div key={`${requirement.role}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                                        <div className="flex flex-col">
                                            <Select
                                                value={requirement.role}
                                                onValueChange={(value) => handleRequirementChange(index, 'role', value)}
                                            >
                                                <SelectTrigger className="border-gray-200 focus:ring-indigo-500 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60">
                                                    {ROLE_LIBRARY.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {role}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`headcount-${index}`} className="text-xs text-gray-500">Headcount</Label>
                                            <Input
                                                id={`headcount-${index}`}
                                                type="number"
                                                min={1}
                                                value={requirement.count}
                                                onChange={(event) => handleRequirementChange(index, 'count', parseInt(event.target.value, 10) || 1)}
                                                className="w-20 border-gray-200 focus-visible:ring-indigo-500"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRequirement(index)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4 border-t border-gray-200 bg-white">
                        <div className="text-xs text-gray-500">
                            Once saved, the project appears instantly across allocation views.
                        </div>
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !form.name.trim() || (managers.length > 0 && !form.managerId)}
                                className="bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                {isSubmitting ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
