import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Project } from '@/types/allocation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddProjectDialogProps {
    project?: Project;
    onSave: (name: string, requirements?: { role: string; count: number }[]) => void;
    trigger?: React.ReactNode;
}

const ROLES = [
    'Senior Frontend Engineer',
    'Frontend Engineer',
    'Backend Lead',
    'Backend Engineer',
    'Full Stack Developer',
    'DevOps Engineer',
    'UI Designer',
    'Product Manager'
];

export function AddProjectDialog({ project, onSave, trigger }: AddProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(project?.name || '');
    const [requirements, setRequirements] = useState<{ role: string; count: number }[]>(project?.requirements || []);

    useEffect(() => {
        if (open && project) {
            setName(project.name);
            setRequirements(project.requirements || []);
        } else if (open && !project) {
            setName('');
            setRequirements([]);
        }
    }, [open, project]);

    const handleAddRequirement = () => {
        setRequirements([...requirements, { role: ROLES[0], count: 1 }]);
    };

    const handleRemoveRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    const updateRequirement = (index: number, field: 'role' | 'count', value: string | number) => {
        const newReqs = [...requirements];
        newReqs[index] = { ...newReqs[index], [field]: value };
        setRequirements(newReqs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim(), requirements);
            setOpen(false);
            if (!project) {
                setName('');
                setRequirements([]);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2 bg-[#00D9FF]/20 text-[#00D9FF] hover:bg-[#00D9FF]/30 border border-[#00D9FF]/30">
                        <Plus className="w-4 h-4" />
                        Add Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#151a21] border-white/10 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{project ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-white/80">Project Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Mobile App Redesign"
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#00D9FF]"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-white/80">Resource Requirements</Label>
                            <Button type="button" onClick={handleAddRequirement} variant="ghost" size="sm" className="h-6 gap-1 text-[#00D9FF] hover:text-[#00D9FF] hover:bg-[#00D9FF]/10">
                                <Plus className="w-3 h-3" /> Add Role
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {requirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Select
                                        value={req.role}
                                        onValueChange={(val) => updateRequirement(index, 'role', val)}
                                    >
                                        <SelectTrigger className="flex-1 bg-black/20 border-white/10 text-white h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#151a21] border-white/10 text-white">
                                            {ROLES.map((r) => (
                                                <SelectItem key={r} value={r} className="focus:bg-[#00D9FF]/20 focus:text-white">{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={req.count}
                                        onChange={(e) => updateRequirement(index, 'count', parseInt(e.target.value) || 1)}
                                        className="w-20 bg-black/20 border-white/10 text-white h-9"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveRequirement(index)}
                                        className="h-9 w-9 text-white/40 hover:text-red-400 hover:bg-white/5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {requirements.length === 0 && (
                                <div className="text-xs text-white/40 italic p-2 border border-dashed border-white/10 rounded text-center">
                                    No specific requirements added
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim()} className="bg-[#00D9FF] text-black hover:bg-[#00D9FF]/90">
                            {project ? 'Save Changes' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
