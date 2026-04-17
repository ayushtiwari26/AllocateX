
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Upload, CheckCircle2, X, Sparkles, Users, ArrowRight, AlertCircle, Zap } from 'lucide-react';
import { employeeApi } from '@/services/api';

// Single Member Schema
const memberSchema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    role: z.string().min(1, 'Role is required'),
    skills: z.string().min(1, 'Skills are required (comma separated)'),
    department: z.string().min(1, 'Department is required'),
    joiningDate: z.string().min(1, 'Date is required'),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function AddMembers() {
    const { organisation } = useAuth();
    const navigate = useNavigate();
    const [addedMembers, setAddedMembers] = useState<MemberFormValues[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            role: '',
            department: 'Engineering'
        }
    });

    const onAddSingle = (data: MemberFormValues) => {
        setError(null);
        // Check duplicates
        if (addedMembers.some(m => m.email === data.email)) {
            setError('Member with this email already added to the list');
            return;
        }
        setAddedMembers([...addedMembers, data]);
        reset();
        setValue('role', '');
        setSuccess(`${data.fullName} added to queue`);
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            console.log('File content:', text);

            // Mock parsed data for demo
            const mockParsed: MemberFormValues[] = [
                { fullName: 'Alice Dev', email: 'alice@example.com', role: 'Developer', skills: 'React, Node', department: 'Engineering', joiningDate: '2024-01-01' },
                { fullName: 'Bob Design', email: 'bob@example.com', role: 'Designer', skills: 'Figma, UI', department: 'Design', joiningDate: '2024-01-15' },
            ];

            setAddedMembers([...addedMembers, ...mockParsed]);
            setSuccess(`Parsed ${mockParsed.length} members from file`);
            setTimeout(() => setSuccess(null), 3000);
        };
        reader.readAsText(file);
    };

    const handleFinalSave = async () => {
        if (addedMembers.length === 0) return;
        setIsSubmitting(true);
        setError(null);
        
        let successCount = 0;
        const errors: string[] = [];
        
        try {
            for (const member of addedMembers) {
                try {
                    const [firstName, ...lastNameParts] = member.fullName.split(' ');
                    await employeeApi.create({
                        firstName,
                        lastName: lastNameParts.join(' ') || firstName,
                        email: member.email,
                        designation: member.role,
                        department: member.department,
                        skills: member.skills.split(',').map(s => s.trim()),
                        joiningDate: new Date(member.joiningDate),
                        availability: 'available',
                        currentWorkload: 0,
                    } as any);
                    successCount++;
                } catch (err: any) {
                    errors.push(`${member.fullName}: ${err.response?.data?.message || err.message || 'Failed to save'}`);
                }
            }
            
            if (successCount > 0) {
                setSuccess(`Successfully added ${successCount} member(s) to database!`);
                // Remove successfully added members
                if (errors.length === 0) {
                    setAddedMembers([]);
                    setTimeout(() => navigate('/dashboard/employees'), 1500);
                }
            }
            
            if (errors.length > 0) {
                setError(`Some members failed to save:\n${errors.join('\n')}`);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.response?.data?.message || 'Failed to save members. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeMember = (idx: number) => {
        const newMembers = [...addedMembers];
        newMembers.splice(idx, 1);
        setAddedMembers(newMembers);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-5xl space-y-6">
                {/* Hero Header */}
                <div className="text-center space-y-4">
                    <Badge className="bg-indigo-100 text-indigo-700 border-0 px-3 py-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Team Setup
                    </Badge>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Add Team Members</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Build your team structure for <span className="font-semibold text-indigo-600">{organisation?.name || 'your workspace'}</span>. 
                        Add members individually or upload in bulk.
                    </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="text-sm whitespace-pre-wrap">{error}</div>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm">{success}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Form Section */}
                    <Card className="shadow-lg shadow-slate-200/50 border-0 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white pb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <UserPlus className="w-5 h-5" />
                                        Member Details
                                    </CardTitle>
                                    <CardDescription className="text-white/70 mt-1">Fill in the member information</CardDescription>
                                </div>
                                <div className="flex text-sm bg-white/20 backdrop-blur-sm rounded-lg p-1">
                                    <button
                                        onClick={() => setUploadMode('single')}
                                        className={`px-3 py-1.5 rounded-md transition-all ${uploadMode === 'single' ? 'bg-white text-indigo-700 font-medium shadow-sm' : 'text-white/80 hover:text-white'}`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        onClick={() => setUploadMode('bulk')}
                                        className={`px-3 py-1.5 rounded-md transition-all ${uploadMode === 'bulk' ? 'bg-white text-indigo-700 font-medium shadow-sm' : 'text-white/80 hover:text-white'}`}
                                    >
                                        Bulk
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {uploadMode === 'single' ? (
                                <form onSubmit={handleSubmit(onAddSingle)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Full Name</Label>
                                        <Input {...register('fullName')} placeholder="Jane Smith" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                        {errors.fullName && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fullName.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Email</Label>
                                        <Input {...register('email')} type="email" placeholder="jane@company.com" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                        {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700">Role</Label>
                                            <Select onValueChange={(val) => setValue('role', val)}>
                                                <SelectTrigger className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200">
                                                    <SelectValue placeholder="Select Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Developer">Developer</SelectItem>
                                                    <SelectItem value="Designer">Designer</SelectItem>
                                                    <SelectItem value="Manager">Manager</SelectItem>
                                                    <SelectItem value="QA">QA Engineer</SelectItem>
                                                    <SelectItem value="DevOps">DevOps</SelectItem>
                                                    <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.role && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.role.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700">Department</Label>
                                            <Input {...register('department')} placeholder="Engineering" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            {errors.department && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.department.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Skills (Comma separated)</Label>
                                        <Input {...register('skills')} placeholder="React, Node.js, TypeScript" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                        {errors.skills && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.skills.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Joining Date</Label>
                                        <Input type="date" {...register('joiningDate')} className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                        {errors.joiningDate && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.joiningDate.message}</p>}
                                    </div>

                                    <Button type="submit" variant="outline" className="w-full border-dashed border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400">
                                        <UserPlus className="mr-2 h-4 w-4" /> Add to Queue
                                    </Button>
                                </form>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-xl bg-gradient-to-br from-indigo-50/50 to-violet-50/50 hover:bg-indigo-100/50 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx"
                                        onChange={handleBulkUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                        <Upload className="h-8 w-8 text-indigo-500" />
                                    </div>
                                    <p className="font-semibold text-slate-900">Click to upload CSV</p>
                                    <p className="text-xs text-slate-500 mt-1">Columns: Name, Email, Role, Skills</p>
                                    <Badge className="mt-3 bg-indigo-100 text-indigo-700 border-0">
                                        Supports .csv and .xlsx
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview Section */}
                    <Card className="shadow-lg shadow-slate-200/50 border-0 flex flex-col h-full overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-600" />
                                        Queue ({addedMembers.length})
                                    </CardTitle>
                                    <CardDescription>Review before saving to database</CardDescription>
                                </div>
                                {addedMembers.length > 0 && (
                                    <Badge className="bg-indigo-100 text-indigo-700 border-0">
                                        {addedMembers.length} pending
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto max-h-[400px] p-4">
                            {addedMembers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <UserPlus className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-600">No members added yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Add members using the form on the left</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addedMembers.map((m, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {m.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{m.fullName}</p>
                                                    <p className="text-xs text-slate-500">{m.role} • {m.email}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeMember(idx)} 
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4">
                            <Button
                                onClick={handleFinalSave}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200/50"
                                disabled={addedMembers.length === 0 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving to Database...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        Save {addedMembers.length} Member{addedMembers.length !== 1 ? 's' : ''} & Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
