import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { TeamMember } from '@/types/allocation';
import { Badge } from '@/components/ui/badge';

interface AddMemberDialogProps {
    member?: TeamMember;
    onSave: (member: Omit<TeamMember, 'id' | 'teamId'>) => void;
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

const COMMON_SKILLS = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'AWS',
    'Docker', 'Kubernetes', 'GraphQL', 'Rust', 'Java'
];

export function AddMemberDialog({ member, onSave, trigger }: AddMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(member?.name || '');
    const [role, setRole] = useState(member?.role || ROLES[0]);
    const [skills, setSkills] = useState<string[]>(member?.skills || []);
    const [currentSkill, setCurrentSkill] = useState('');

    useEffect(() => {
        if (open && member) {
            setName(member.name);
            setRole(member.role);
            setSkills(member.skills || []);
        } else if (open && !member) {
            setName('');
            setRole(ROLES[0]);
            setSkills([]);
        }
    }, [open, member]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            const memberData: Omit<TeamMember, 'id' | 'teamId'> = {
                name: name.trim(),
                role,
                avatar: member?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                skills,
                currentWorkload: member?.currentWorkload || 0,
                maxCapacity: member?.maxCapacity || 40,
                velocity: member?.velocity || 3,
                availability: member?.availability || 'available'
            };

            onSave(memberData);
            setOpen(false);
            if (!member) {
                setName('');
                setRole(ROLES[0]);
                setSkills([]);
            }
        }
    };

    const toggleSkill = (skill: string) => {
        if (skills.includes(skill)) {
            setSkills(skills.filter(s => s !== skill));
        } else {
            setSkills([...skills, skill]);
        }
    };

    const addCustomSkill = () => {
        if (currentSkill && !skills.includes(currentSkill)) {
            setSkills([...skills, currentSkill]);
            setCurrentSkill('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10">
                        <Plus className="w-4 h-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#151a21] border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{member ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-white/80">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Alex Smith"
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#00D9FF]"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role" className="text-white/80">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-[#00D9FF]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#151a21] border-white/10 text-white">
                                {ROLES.map((r) => (
                                    <SelectItem key={r} value={r} className="focus:bg-[#00D9FF]/20 focus:text-white">
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-white/80">Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                value={currentSkill}
                                onChange={(e) => setCurrentSkill(e.target.value)}
                                placeholder="Add custom skill..."
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCustomSkill();
                                    }
                                }}
                            />
                            <Button type="button" onClick={addCustomSkill} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">Add</Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="cursor-pointer hover:bg-red-500/20 bg-white/5 text-white border-white/10" onClick={() => toggleSkill(skill)}>
                                    {skill} <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-2 mt-2">
                            <p className="text-xs text-white/50 mb-2">Suggested Skills:</p>
                            <div className="flex flex-wrap gap-1">
                                {COMMON_SKILLS.filter(s => !skills.includes(s)).map(skill => (
                                    <Badge
                                        key={skill}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-[#00D9FF]/20 text-white/60 border-white/10"
                                        onClick={() => toggleSkill(skill)}
                                    >
                                        + {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim()} className="bg-[#00D9FF] text-black hover:bg-[#00D9FF]/90">
                            {member ? 'Save Changes' : 'Add Member'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
