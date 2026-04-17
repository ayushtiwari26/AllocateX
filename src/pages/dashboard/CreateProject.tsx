
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { employeeApi, projectApi } from '@/services/api';
import { Loader2, FolderKanban, Sparkles, ArrowLeft, CheckCircle2, AlertCircle, Calendar, Users, Code, Target, Zap, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const projectSchema = z.object({
    name: z.string().min(2, 'Project Name is required'),
    description: z.string().optional(),
    technologies: z.string().min(1, 'Tech stack is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    priority: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function CreateProject() {
    const { organisation } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [priority, setPriority] = useState<string>('medium');

    React.useEffect(() => {
        employeeApi.getAll().then(setEmployees).catch(console.error);
    }, []);

    const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            priority: 'medium'
        }
    });

    const onSubmit = async (data: ProjectFormValues) => {
        if (!organisation) {
            setError('Organization not found. Please log in again.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const projectData = {
                name: data.name,
                description: data.description || '',
                status: 'planning' as const,
                priority: (priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                budget: 0,
                clientId: null,
                managerId: selectedManagerId || null,
                techStack: data.technologies.split(',').map(t => t.trim()).filter(Boolean),
            };
            
            console.log('Creating project with data:', projectData);
            
            const result = await projectApi.create(projectData);
            console.log('Project created successfully:', result);
            
            setSuccess(`Project "${data.name}" created successfully!`);
            setTimeout(() => navigate('/dashboard/projects'), 1500);
        } catch (e: any) {
            console.error('Error creating project:', e);
            setError(e.response?.data?.message || e.message || 'Failed to create project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Hero Header */}
                <div className="mb-8">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/dashboard/projects')}
                        className="mb-4 text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Projects
                    </Button>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <FolderKanban className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <Badge className="bg-indigo-100 text-indigo-700 border-0 mb-2">
                                <Sparkles className="w-3 h-3 mr-1" />
                                New Project
                            </Badge>
                            <h1 className="text-2xl font-bold text-slate-900">Create New Project</h1>
                            <p className="text-slate-500">Define the scope, timeline, and team for your project</p>
                        </div>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">{error}</div>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                {success && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm">{success}</span>
                    </div>
                )}

                <Card className="shadow-lg shadow-slate-200/50 border-0 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Project Details
                        </CardTitle>
                        <CardDescription className="text-white/70">Fill in the project information below</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Project Name */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4 text-indigo-500" />
                                    Project Name
                                </Label>
                                <Input 
                                    {...register('name')} 
                                    placeholder="e.g. Mobile App Redesign" 
                                    className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* Project Manager & Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-500" />
                                        Project Manager
                                    </Label>
                                    <Select onValueChange={setSelectedManagerId} value={selectedManagerId}>
                                        <SelectTrigger className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200">
                                            <SelectValue placeholder="Select a Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(e => (
                                                <SelectItem key={e.id} value={e.id}>
                                                    {e.firstName} {e.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-slate-700 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-indigo-500" />
                                        Priority
                                    </Label>
                                    <Select onValueChange={setPriority} value={priority}>
                                        <SelectTrigger className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200">
                                            <SelectValue placeholder="Select Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                                                    Low
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    Medium
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="high">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                    High
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="critical">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                    Critical
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label className="text-slate-700">Description</Label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    {...register('description')}
                                    placeholder="Describe the project goals, scope, and expected outcomes..."
                                />
                            </div>

                            {/* Technologies */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-2">
                                    <Code className="w-4 h-4 text-indigo-500" />
                                    Tech Stack
                                </Label>
                                <Input 
                                    {...register('technologies')} 
                                    placeholder="React, Node.js, AWS, PostgreSQL" 
                                    className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                                />
                                <p className="text-xs text-slate-400">Separate technologies with commas</p>
                                {errors.technologies && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.technologies.message}
                                    </p>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        Start Date
                                    </Label>
                                    <Input 
                                        type="date" 
                                        {...register('startDate')} 
                                        className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                                    />
                                    {errors.startDate && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.startDate.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        End Date
                                    </Label>
                                    <Input 
                                        type="date" 
                                        {...register('endDate')} 
                                        className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                                    />
                                    {errors.endDate && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.endDate.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-3 bg-slate-50/50 border-t border-slate-100">
                        <Button 
                            variant="outline" 
                            type="button" 
                            onClick={() => navigate('/dashboard/projects')}
                            className="border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            onClick={handleSubmit(onSubmit)}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200/50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Project...
                                </>
                            ) : (
                                <>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Create Project
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
